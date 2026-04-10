import {
  DiscoveryRepository,
  type DiscoveryProfile,
} from '../repositories/discovery-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import {
  calculateAge,
  scoreCasteMatch,
  scoreAgeProximity,
  scoreLocation,
  scoreReligion,
  scoreMutualCompatibility,
  scoreMaritalStatus,
  scoreEducation,
  scoreQuality,
  scoreRecency,
  getRelatedCastes,
  type CandidatePreferences,
} from './matching.js';
import { getActiveCooldowns } from './seen-tracking.js';
import { logger } from '../../shared/utils/logger.js';

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
    const caste = profile.caste as string | undefined;

    const account = await this.coreRepo.get<{ phone?: string }>(`USER#${userId}`, 'ACCOUNT#v1');
    const phoneVerified = !!account?.phone;

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
      phoneVerified,
      lastActiveAt: new Date().toISOString(),
      GSI1PK: `COUNTRY#${country}#GENDER#${gender}`,
      GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
      GSI2PK: `RELIGION#${religion}#GENDER#${gender}`,
      GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
      ...(caste ? {
        GSI3PK: `CASTE#${caste}#GENDER#${gender}`,
        GSI3SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
      } : {}),
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
  ): Promise<{ items: (DiscoveryProfile & { isBoosted: boolean; matchScore: number; rank: number })[]; nextCursor?: string }> {

    const parsed = decodeCursor(cursor);
    if (parsed && parsed.p > 0) {
      const snapshot = await this.coreRepo.get<FeedSnapshot>(
        `USER#${userId}`,
        `SNAPSHOT#${parsed.s}`,
      );
      if (snapshot) {
        return this.serveFromSnapshot(userId, snapshot, parsed.s, parsed.p, limit);
      }
    }

    const [prefs, myProfile, blockRecord, cooldownIds, interactedResult] = await Promise.all([
      this.coreRepo.get<UserPreferences>(`USER#${userId}`, 'PREFERENCE#v1'),
      this.coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'PROFILE#v1'),
      this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId}`, 'BLOCK'),
      getActiveCooldowns(this.coreRepo, userId),
      this.coreRepo.query<{ SK: string }>(`USER#${userId}`, { limit: 500 }),
    ]);

    if (!myProfile) {
      return { items: [] };
    }

    const blockedIds = new Set<string>(blockRecord?.blockedUserIds || []);

    const interactedIds = new Set<string>();
    for (const item of interactedResult.items) {
      if (item.SK.startsWith('INTEREST#OUT#')) {
        interactedIds.add(item.SK.replace('INTEREST#OUT#', ''));
      } else if (item.SK.startsWith('INTEREST#IN#')) {
        interactedIds.add(item.SK.replace('INTEREST#IN#', ''));
      }
    }

    const myGender = myProfile.gender as string;
    const myAge = myProfile.dateOfBirth ? calculateAge(myProfile.dateOfBirth as string) : 0;
    const lookingForGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : undefined;

    const bufferMultiplier = 3;
    const fetchLimit = (limit + blockedIds.size + interactedIds.size) * bufferMultiplier;

    const fetchPromises: Promise<DiscoveryProfile[]>[] = [];

    if (prefs?.castes?.length && lookingForGender) {
      const castesToFetch = new Set<string>();
      for (const caste of prefs.castes.slice(0, 3)) {
        castesToFetch.add(caste);
        for (const related of getRelatedCastes(caste)) {
          castesToFetch.add(related);
        }
      }
      const casteList = [...castesToFetch].slice(0, 6);
      for (const caste of casteList) {
        fetchPromises.push(
          this.discoveryRepo.searchByCasteAndGender(caste, lookingForGender, { limit: fetchLimit })
            .then(r => r.items),
        );
      }
    }

    if (prefs?.countries?.length && lookingForGender) {
      for (const country of prefs.countries.slice(0, 3)) {
        fetchPromises.push(
          this.discoveryRepo.searchByCountryAndGender(country, lookingForGender, { limit: fetchLimit })
            .then(r => r.items),
        );
      }
    }

    if (prefs?.religions?.length && lookingForGender) {
      for (const religion of prefs.religions.slice(0, 3)) {
        fetchPromises.push(
          this.discoveryRepo.searchByReligionAndGender(religion, lookingForGender, { limit: fetchLimit })
            .then(r => r.items),
        );
      }
    }

    fetchPromises.push(
      this.discoveryRepo.getAllProfiles(fetchLimit).then(r => r.items),
    );

    const pools = await Promise.all(fetchPromises);
    const allResults = pools.flat();

    const seen = new Set<string>();
    const unique = allResults.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    let filtered = unique.filter((p) => {
      if (p.userId === userId) return false;
      if (blockedIds.has(p.userId)) return false;
      if (lookingForGender && p.gender !== lookingForGender) return false;
      if (interactedIds.has(p.userId)) return false;
      return true;
    });

    // Graceful cooldown: if filtering leaves too few results, keep cooldown profiles
    if (cooldownIds.size > 0) {
      const withoutCooldown = filtered.filter((p) => !cooldownIds.has(p.userId));
      if (withoutCooldown.length >= limit / 2) {
        filtered = withoutCooldown;
      }
    }

    if (prefs) {
      filtered = filtered.filter((p) => {
        const ageBuffer = 5;
        if (prefs.ageMin && p.age < prefs.ageMin - ageBuffer) return false;
        if (prefs.ageMax && p.age > prefs.ageMax + ageBuffer) return false;
        return true;
      });
    }

    const profileIds = filtered.map(p => p.userId);
    const [boostMap, subMap, candidatePrefsMap] = await batchGetStatus(this.coreRepo, profileIds);

    const viewerForMutual = {
      age: myAge,
      religion: myProfile.religion as string,
      caste: myProfile.caste as string | undefined,
      education: myProfile.education as string,
      country: myProfile.country as string,
      maritalStatus: myProfile.maritalStatus as string,
    };

    const scored = filtered.map((p) => {
      let score = 0;

      score += scoreAgeProximity(myAge, p.age);
      score += scoreCasteMatch(myProfile.caste as string | undefined, p.caste);
      score += scoreLocation(
        { city: myProfile.city as string, state: myProfile.state as string, country: myProfile.country as string },
        { city: p.city, state: p.state, country: p.country },
      );
      score += scoreReligion(p.religion, myProfile.religion as string, prefs?.religions);
      score += scoreMutualCompatibility(viewerForMutual, candidatePrefsMap.get(p.userId));
      score += scoreMaritalStatus(p.maritalStatus, myProfile.maritalStatus as string, prefs?.maritalStatuses);
      if (boostMap.has(p.userId)) score += 7;
      score += scoreEducation(p.education, prefs?.educations);
      score += scoreQuality(p);
      if (subMap.get(p.userId) === 'platinum') score += 5;
      score += scoreRecency(p.lastActiveAt);

      return { ...p, _matchScore: score, _isBoosted: boostMap.has(p.userId) };
    });

    scored.sort((a, b) => b._matchScore - a._matchScore);

    const shaped = shapeFeedDiversity(scored);

    const snapshotId = Date.now().toString(36);
    const rankedUserIds = shaped.map(p => p.userId);
    const boostedUserIds = shaped.filter(p => p._isBoosted).map(p => p.userId);
    const scores: Record<string, number> = {};
    for (const p of shaped) {
      scores[p.userId] = p._matchScore;
    }

    const ttl = Math.floor(Date.now() / 1000) + SNAPSHOT_TTL_SEC;

    Promise.all([
      this.coreRepo.put({
        PK: `USER#${userId}`,
        SK: `SNAPSHOT#${snapshotId}`,
        rankedUserIds,
        boostedUserIds,
        scores,
        ttl,
      }),
      this.coreRepo.put({
        PK: `USER#${userId}`,
        SK: 'SNAPSHOT#LATEST',
        snapshotId,
        ttl,
      }),
    ]).catch((err) => { logger.warn('Failed to save discovery snapshot', { error: String(err) }); });

    const pageItems = shaped.slice(0, limit);
    const items = pageItems.map(({ _matchScore, _isBoosted, ...p }, index) => ({
      ...p,
      isBoosted: _isBoosted,
      matchScore: _matchScore,
      rank: index + 1,
    }));

    const hasMore = limit < shaped.length;
    const nextCursor = hasMore ? encodeCursor(snapshotId, 1) : undefined;

    return { items, nextCursor };
  }

  private async serveFromSnapshot(
    userId: string,
    snapshot: FeedSnapshot,
    snapshotId: string,
    page: number,
    limit: number,
  ): Promise<{ items: (DiscoveryProfile & { isBoosted: boolean; matchScore: number; rank: number })[]; nextCursor?: string }> {
    const startIndex = page * limit;
    const pageUserIds = snapshot.rankedUserIds.slice(startIndex, startIndex + limit);

    if (pageUserIds.length === 0) {
      return { items: [] };
    }

    const [profileMap, blockRecord] = await Promise.all([
      this.discoveryRepo.getProfilesByIds(pageUserIds),
      this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId}`, 'BLOCK'),
    ]);

    const blockedIds = new Set<string>(blockRecord?.blockedUserIds || []);
    const boostedSet = new Set<string>(snapshot.boostedUserIds);
    const items: (DiscoveryProfile & { isBoosted: boolean; matchScore: number; rank: number })[] = [];
    for (const uid of pageUserIds) {
      if (blockedIds.has(uid)) continue;
      const profile = profileMap.get(uid);
      if (!profile) continue;
      const globalIndex = snapshot.rankedUserIds.indexOf(uid);
      items.push({
        ...profile,
        isBoosted: boostedSet.has(uid),
        matchScore: snapshot.scores?.[uid] ?? 0,
        rank: globalIndex + 1,
      });
    }

    const hasMore = startIndex + limit < snapshot.rankedUserIds.length;
    const nextCursor = hasMore ? encodeCursor(snapshotId, page + 1) : undefined;

    return { items, nextCursor };
  }

  async search(
    userId: string,
    filters: SearchFilters,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: DiscoveryProfile[]; nextCursor?: string }> {
    const startKey = cursor ? (() => { try { return JSON.parse(Buffer.from(cursor, 'base64').toString()); } catch { return undefined; } })() : undefined;

    const blockRecord = await this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId}`, 'BLOCK');
    const blockedIds = new Set<string>(blockRecord?.blockedUserIds || []);

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

const SNAPSHOT_TTL_SEC = 15 * 60;

interface FeedSnapshot {
  rankedUserIds: string[];
  boostedUserIds: string[];
  scores: Record<string, number>;
  ttl: number;
}

interface CursorPayload {
  s: string;
  p: number;
}

function encodeCursor(snapshotId: string, page: number): string {
  return Buffer.from(JSON.stringify({ s: snapshotId, p: page })).toString('base64');
}

function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString());
    if (typeof parsed.s === 'string' && typeof parsed.p === 'number') {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

const DIVERSITY_WINDOW = 10;
const MAX_SAME_CITY = 3;
const MAX_SAME_RELIGION = 4;

interface ScoredProfile extends DiscoveryProfile {
  _matchScore: number;
  _isBoosted: boolean;
}

function shapeFeedDiversity(sorted: ScoredProfile[]): ScoredProfile[] {
  const result: ScoredProfile[] = [];
  const deferred: ScoredProfile[] = [];

  for (const profile of sorted) {
    if (profile._isBoosted) {
      result.push(profile);
      continue;
    }

    const windowStart = Math.max(0, result.length - (DIVERSITY_WINDOW - 1));
    const window = result.slice(windowStart);

    let cityCount = 0;
    let religionCount = 0;

    for (const w of window) {
      if (profile.city && w.city && w.city.toLowerCase() === profile.city.toLowerCase()) {
        cityCount++;
      }
      if (w.religion === profile.religion) {
        religionCount++;
      }
    }

    const cityExceeded = profile.city && cityCount >= MAX_SAME_CITY;
    const religionExceeded = religionCount >= MAX_SAME_RELIGION;

    if (cityExceeded || religionExceeded) {
      deferred.push(profile);
    } else {
      result.push(profile);
    }
  }

  result.push(...deferred);

  return result;
}

async function batchGetStatus(
  coreRepo: BaseRepository,
  userIds: string[],
): Promise<[Set<string>, Map<string, string>, Map<string, CandidatePreferences>]> {
  const now = new Date();
  const boostedIds = new Set<string>();
  const planMap = new Map<string, string>();
  const prefsMap = new Map<string, CandidatePreferences>();

  const results = await Promise.all(
    userIds.map(async (uid) => {
      const [boost, sub, prefs] = await Promise.all([
        coreRepo.get<{ expiresAt: string }>(`USER#${uid}`, 'BOOST#ACTIVE'),
        coreRepo.get<{ planId: string; status: string }>(`USER#${uid}`, 'SUBSCRIPTION#ACTIVE'),
        coreRepo.get<CandidatePreferences>(`USER#${uid}`, 'PREFERENCE#v1'),
      ]);
      return { uid, boost, sub, prefs };
    }),
  );

  for (const { uid, boost, sub, prefs } of results) {
    if (boost && new Date(boost.expiresAt) > now) {
      boostedIds.add(uid);
    }
    if (sub?.status === 'active') {
      planMap.set(uid, sub.planId);
    }
    if (prefs) {
      prefsMap.set(uid, prefs);
    }
  }

  return [boostedIds, planMap, prefsMap];
}
