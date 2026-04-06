import {
  DiscoveryRepository,
  type DiscoveryProfile,
} from '../repositories/discovery-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { calculateAge } from './matching.js';

interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  country?: string;
  state?: string;
  city?: string;
  religion?: string;
  caste?: string;
  education?: string;
  maritalStatus?: string;
  hasPhoto?: boolean;
}

interface UserPreferences {
  ageMin?: number;
  ageMax?: number;
  religions?: string[];
  castes?: string[];
  educations?: string[];
  countries?: string[];
  maritalStatuses?: string[];
}

export class DiscoveryService {
  private discoveryRepo: DiscoveryRepository;
  private coreRepo: BaseRepository;

  constructor() {
    this.discoveryRepo = new DiscoveryRepository();
    this.coreRepo = new BaseRepository('core');
  }

  async syncProfileToDiscovery(userId: string): Promise<void> {
    const profile = await this.coreRepo.get<Record<string, unknown>>(
      `USER#${userId}`,
      'PROFILE#v1',
    );
    if (!profile) return;

    const privacy = await this.coreRepo.get<Record<string, unknown>>(
      `USER#${userId}`,
      'PRIVACY#v1',
    );
    const showInSearch = privacy?.showInSearch !== false;
    if (!showInSearch) {
      await this.discoveryRepo.removeProjection(userId);
      return;
    }

    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth as string) : 0;
    const gender = profile.gender as string;
    const country = profile.country as string;
    const religion = profile.religion as string;

    const projection: DiscoveryProfile = {
      PK: `PROFILE#${userId}`,
      SK: 'DISCOVERY#v1',
      userId,
      name: profile.name as string,
      gender,
      age,
      height: profile.height as number,
      religion,
      caste: profile.caste as string | undefined,
      motherTongue: profile.motherTongue as string,
      education: profile.education as string,
      occupation: profile.occupation as string | undefined,
      country,
      state: profile.state as string | undefined,
      city: profile.city as string | undefined,
      maritalStatus: profile.maritalStatus as string,
      primaryPhotoUrl: profile.primaryPhotoUrl as string | undefined,
      profileCompletion: profile.profileCompletion as number,
      aboutMe: profile.aboutMe as string | undefined,
      lastActiveAt: new Date().toISOString(),
      GSI1PK: `COUNTRY#${country}#GENDER#${gender}`,
      GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
      GSI2PK: `RELIGION#${religion}#GENDER#${gender}`,
      GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
    };

    await this.discoveryRepo.upsertProjection(projection);

    await this.discoveryRepo.put({
      ...projection,
      PK: 'DISCOVERY#ALL',
      SK: `PROFILE#${projection.lastActiveAt}#${userId}`,
    } as unknown as Record<string, unknown>);
  }

  async getRecommendations(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: DiscoveryProfile[]; nextCursor?: string }> {
    const [prefs, myProfile, blockedResult] = await Promise.all([
      this.coreRepo.get<UserPreferences>(`USER#${userId}`, 'PREFERENCE#v1'),
      this.coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'PROFILE#v1'),
      this.coreRepo.query<{ SK: string }>(`USER#${userId}`, { limit: 100 }),
    ]);

    if (!myProfile) {
      return { items: [] };
    }

    const blockedIds = new Set<string>();
    for (const item of blockedResult.items) {
      if (item.SK.startsWith('BLOCK#')) {
        blockedIds.add(item.SK.replace('BLOCK#', ''));
      }
    }

    const myGender = myProfile.gender as string;
    const lookingForGender =
      myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : undefined;

    let allResults: DiscoveryProfile[] = [];
    const startKey = cursor ? (() => { try { return JSON.parse(Buffer.from(cursor, 'base64').toString()); } catch { return undefined; } })() : undefined;
    let lastKey: Record<string, unknown> | undefined;

    if (prefs?.countries?.length && lookingForGender) {
      for (const country of prefs.countries) {
        const results = await this.discoveryRepo.searchByCountryAndGender(
          country,
          lookingForGender,
          { limit: limit + 10, exclusiveStartKey: startKey },
        );
        allResults.push(...results.items);
        if (results.lastKey) lastKey = results.lastKey;
        if (allResults.length >= limit + 10) break;
      }
    }

    if (allResults.length < limit && prefs?.religions?.length && lookingForGender) {
      for (const religion of prefs.religions) {
        const results = await this.discoveryRepo.searchByReligionAndGender(
          religion,
          lookingForGender,
          { limit: limit + 10, exclusiveStartKey: startKey },
        );
        allResults.push(...results.items);
        if (results.lastKey) lastKey = results.lastKey;
        if (allResults.length >= limit + 10) break;
      }
    }

    if (allResults.length < limit) {
      const results = await this.discoveryRepo.getAllProfiles(limit + 20);
      allResults.push(...results.items);
      if (results.lastKey) lastKey = results.lastKey;
    }

    const seen = new Set<string>();
    allResults = allResults.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    let filtered = allResults.filter((p) => p.userId !== userId && !blockedIds.has(p.userId));

    if (lookingForGender) {
      filtered = filtered.filter((p) => p.gender === lookingForGender);
    }

    if (prefs) {
      filtered = filtered.filter((p) => {
        if (prefs.ageMin && p.age < prefs.ageMin) return false;
        if (prefs.ageMax && p.age > prefs.ageMax) return false;
        if (prefs.religions?.length && !prefs.religions.includes(p.religion)) return false;
        if (prefs.castes?.length && p.caste && !prefs.castes.includes(p.caste)) return false;
        return true;
      });
    }

    filtered = await scoreAndSort(filtered, myProfile, prefs);

    const items = filtered.slice(0, limit);
    const nextCursor = lastKey
      ? Buffer.from(JSON.stringify(lastKey)).toString('base64')
      : undefined;

    return { items, nextCursor };
  }

  async search(
    userId: string,
    filters: SearchFilters,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: DiscoveryProfile[]; nextCursor?: string }> {
    const startKey = cursor ? (() => { try { return JSON.parse(Buffer.from(cursor, 'base64').toString()); } catch { return undefined; } })() : undefined;

    const blockedResult = await this.coreRepo.query<{ SK: string }>(`USER#${userId}`, {
      limit: 100,
    });
    const blockedIds = new Set<string>();
    for (const item of blockedResult.items) {
      if (item.SK.startsWith('BLOCK#')) {
        blockedIds.add(item.SK.replace('BLOCK#', ''));
      }
    }

    let results: { items: DiscoveryProfile[]; lastKey?: Record<string, unknown> };

    if (filters.country && filters.gender) {
      results = await this.discoveryRepo.searchByCountryAndGender(filters.country, filters.gender, {
        limit: limit + 10,
        exclusiveStartKey: startKey,
      });
    } else if (filters.religion && filters.gender) {
      results = await this.discoveryRepo.searchByReligionAndGender(
        filters.religion,
        filters.gender,
        { limit: limit + 10, exclusiveStartKey: startKey },
      );
    } else {
      results = await this.discoveryRepo.getAllProfiles(limit + 10);
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduped = results.items.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    let filtered = deduped.filter((p) => p.userId !== userId && !blockedIds.has(p.userId));

    if (filters.gender) filtered = filtered.filter((p) => p.gender === filters.gender);
    if (filters.ageMin) filtered = filtered.filter((p) => p.age >= filters.ageMin!);
    if (filters.ageMax) filtered = filtered.filter((p) => p.age <= filters.ageMax!);
    if (filters.country) filtered = filtered.filter((p) => p.country === filters.country);
    if (filters.state) filtered = filtered.filter((p) => p.state === filters.state);
    if (filters.city)
      filtered = filtered.filter((p) =>
        p.city?.toLowerCase().includes(filters.city!.toLowerCase()),
      );
    if (filters.religion) filtered = filtered.filter((p) => p.religion === filters.religion);
    if (filters.caste) filtered = filtered.filter((p) => p.caste === filters.caste);
    if (filters.education) filtered = filtered.filter((p) => p.education === filters.education);
    if (filters.maritalStatus)
      filtered = filtered.filter((p) => p.maritalStatus === filters.maritalStatus);
    if (filters.hasPhoto) filtered = filtered.filter((p) => !!p.primaryPhotoUrl);

    const items = filtered.slice(0, limit);
    const nextCursor = results.lastKey
      ? Buffer.from(JSON.stringify(results.lastKey)).toString('base64')
      : undefined;

    return { items, nextCursor };
  }
}

async function scoreAndSort(
  profiles: DiscoveryProfile[],
  myProfile: Record<string, unknown> | null,
  prefs: UserPreferences | null,
): Promise<DiscoveryProfile[]> {
  if (!myProfile) return profiles;

  // Check which profiles are currently boosted
  const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
  const boostRepo = new BaseRepository('core');
  const now = new Date();

  const boostedUserIds = new Set<string>();
  for (const p of profiles) {
    const boost = await boostRepo.get<{ expiresAt: string }>(`USER#${p.userId}`, 'BOOST#ACTIVE');
    if (boost && new Date(boost.expiresAt) > now) {
      boostedUserIds.add(p.userId);
    }
  }

  return profiles
    .map((p) => {
      let score = 0;

      if (boostedUserIds.has(p.userId)) score += 100;

      if (prefs?.religions?.includes(p.religion)) score += 30;
      else if (p.religion === myProfile.religion) score += 20;

      if (p.caste && prefs?.castes?.includes(p.caste)) score += 20;
      if (p.country === myProfile.country) score += 15;
      if (prefs?.educations?.includes(p.education)) score += 10;
      if (p.primaryPhotoUrl) score += 10;
      score += Math.floor(p.profileCompletion / 10);

      return { ...p, _matchScore: score, _isBoosted: boostedUserIds.has(p.userId) };
    })
    .sort(
      (a, b) =>
        (b as unknown as { _matchScore: number })._matchScore -
        (a as unknown as { _matchScore: number })._matchScore,
    )
    .map(({ _matchScore: _, _isBoosted, ...p }) => ({ ...p, isBoosted: _isBoosted }) as DiscoveryProfile & { isBoosted: boolean });
}
