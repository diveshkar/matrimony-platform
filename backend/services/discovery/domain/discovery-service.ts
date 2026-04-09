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
    };

    await this.discoveryRepo.upsertProjection(projection);

    await this.discoveryRepo.put({
      ...projection,
      PK: 'DISCOVERY#ALL',
      SK: `PROFILE#${projection.lastActiveAt}#${userId}`,
    } as unknown as Record<string, unknown>);
  }

  // ═══════════════════════════════════════════════════════════════
  // DISCOVERY ALGORITHM v2
  // 10-step optimized: parallel fetch, smart buffer, seen tracking,
  // exclude interacted, batch scoring, rebalanced weights
  // ═══════════════════════════════════════════════════════════════

  async getRecommendations(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<{ items: DiscoveryProfile[]; nextCursor?: string }> {

    // ── Step 1: Fetch user context (all parallel) ────────────
    const [prefs, myProfile, blockRecord, seenRecord, interactedResult] = await Promise.all([
      this.coreRepo.get<UserPreferences>(`USER#${userId}`, 'PREFERENCE#v1'),
      this.coreRepo.get<Record<string, unknown>>(`USER#${userId}`, 'PROFILE#v1'),
      this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId}`, 'BLOCK'),
      this.coreRepo.get<{ seenUserIds?: string[] }>(`USER#${userId}`, `SEEN#${todayKey()}`),
      this.coreRepo.query<{ SK: string }>(`USER#${userId}`, { limit: 500 }),
    ]);

    if (!myProfile) {
      return { items: [] };
    }

    // Build exclusion sets
    const blockedIds = new Set<string>(blockRecord?.blockedUserIds || []);
    const seenIds = new Set<string>(seenRecord?.seenUserIds || []);

    // Build interacted set (interests sent/received + conversations)
    const interactedIds = new Set<string>();
    for (const item of interactedResult.items) {
      if (item.SK.startsWith('INTEREST#OUT#')) {
        interactedIds.add(item.SK.replace('INTEREST#OUT#', ''));
      } else if (item.SK.startsWith('INTEREST#IN#')) {
        interactedIds.add(item.SK.replace('INTEREST#IN#', ''));
      }
    }

    // Parse cursor (page number for offset-based pagination)
    const page = cursor ? (() => { try { return JSON.parse(Buffer.from(cursor, 'base64').toString()).page as number; } catch { return 0; } })() : 0;

    const myGender = myProfile.gender as string;
    const myAge = myProfile.dateOfBirth ? calculateAge(myProfile.dateOfBirth as string) : 0;
    const lookingForGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : undefined;

    // ── Step 2: Parallel multi-source fetch with smart buffer ─
    // Fetch extra to account for losses from dedup/block/filter
    const bufferMultiplier = 3;
    const fetchLimit = (limit + blockedIds.size + interactedIds.size) * bufferMultiplier;

    const fetchPromises: Promise<DiscoveryProfile[]>[] = [];

    // Source 1: Preferred countries (parallel, max 3)
    if (prefs?.countries?.length && lookingForGender) {
      for (const country of prefs.countries.slice(0, 3)) {
        fetchPromises.push(
          this.discoveryRepo.searchByCountryAndGender(country, lookingForGender, { limit: fetchLimit })
            .then(r => r.items),
        );
      }
    }

    // Source 2: Preferred religions (parallel, max 3)
    if (prefs?.religions?.length && lookingForGender) {
      for (const religion of prefs.religions.slice(0, 3)) {
        fetchPromises.push(
          this.discoveryRepo.searchByReligionAndGender(religion, lookingForGender, { limit: fetchLimit })
            .then(r => r.items),
        );
      }
    }

    // Source 3: Fallback — all profiles (always included for diversity)
    fetchPromises.push(
      this.discoveryRepo.getAllProfiles(fetchLimit).then(r => r.items),
    );

    // All queries run at the same time
    const pools = await Promise.all(fetchPromises);
    const allResults = pools.flat();

    // ── Step 3: Deduplicate ──────────────────────────────────
    const seen = new Set<string>();
    const unique = allResults.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });

    // ── Step 4: Hard filter (remove self, blocked, wrong gender, interacted) ─
    let filtered = unique.filter((p) => {
      if (p.userId === userId) return false;
      if (blockedIds.has(p.userId)) return false;
      if (lookingForGender && p.gender !== lookingForGender) return false;
      if (interactedIds.has(p.userId)) return false;
      return true;
    });

    // Try to exclude already-seen profiles, but if that leaves too few results, show them again
    if (seenIds.size > 0 && page === 0) {
      const withoutSeen = filtered.filter((p) => !seenIds.has(p.userId));
      if (withoutSeen.length >= limit / 2) {
        filtered = withoutSeen;
      }
    }

    // ── Step 5: Soft filter (age — only remove if WAY outside range) ─
    // Keep profiles within ±5 years of preference for partial matches
    if (prefs) {
      filtered = filtered.filter((p) => {
        const ageBuffer = 5;
        if (prefs.ageMin && p.age < prefs.ageMin - ageBuffer) return false;
        if (prefs.ageMax && p.age > prefs.ageMax + ageBuffer) return false;
        return true;
      });
    }

    // ── Step 6: Batch fetch boost + subscription (parallel, not N+1) ─
    const profileIds = filtered.map(p => p.userId);
    const [boostMap, subMap] = await batchGetStatus(this.coreRepo, profileIds);

    // ── Step 7: Score each profile (rebalanced weights) ──────
    const scored = filtered.map((p) => {
      let score = 0;

      // Premium bonuses (capped at ~27% of max)
      if (boostMap.has(p.userId)) score += 25;
      if (subMap.get(p.userId) === 'platinum') score += 15;

      // Age proximity (strongest organic signal — max 25)
      const ageDiff = Math.abs(p.age - myAge);
      score += Math.max(0, 25 - ageDiff * 2);

      // Location match (tiered — max 20)
      if (p.city && p.city === myProfile.city) score += 20;
      else if (p.state && p.state === myProfile.state) score += 12;
      else if (p.country === myProfile.country) score += 6;

      // Religion match (max 20)
      if (prefs?.religions?.includes(p.religion)) score += 20;
      else if (p.religion === myProfile.religion) score += 10;

      // Caste match (max 15)
      if (p.caste && prefs?.castes?.includes(p.caste)) score += 15;

      // Education match (max 10)
      if (prefs?.educations?.includes(p.education)) score += 10;

      // Marital status match (max 5)
      if (prefs?.maritalStatuses?.includes(p.maritalStatus)) score += 5;

      // Profile quality signals
      if (p.primaryPhotoUrl) score += 5;
      if (p.phoneVerified) score += 3;
      score += Math.floor(p.profileCompletion / 20); // 0-5

      // Recency bonus (max 5)
      if (p.lastActiveAt) {
        const hoursSinceActive = (Date.now() - new Date(p.lastActiveAt).getTime()) / 3_600_000;
        if (hoursSinceActive < 24) score += 5;
        else if (hoursSinceActive < 72) score += 3;
        else if (hoursSinceActive < 168) score += 1;
      }

      // Within preference age range? Bonus
      const inAgeRange = (!prefs?.ageMin || p.age >= prefs.ageMin) && (!prefs?.ageMax || p.age <= prefs.ageMax);
      if (inAgeRange) score += 5;

      return { ...p, _matchScore: score, _isBoosted: boostMap.has(p.userId) };
    });

    // ── Step 8: Sort by score (highest first) ────────────────
    scored.sort((a, b) => b._matchScore - a._matchScore);

    // ── Step 9: Paginate (offset-based, no broken cursors) ───
    const startIndex = page * limit;
    const pageItems = scored.slice(startIndex, startIndex + limit);

    const items = pageItems.map(({ _matchScore: _, _isBoosted, ...p }) => ({
      ...p,
      isBoosted: _isBoosted,
    })) as (DiscoveryProfile & { isBoosted: boolean })[];

    // Step 10: Seen tracking moved to profile detail handler
    // Profile is marked as "seen" only when user clicks on it (not just loading the grid)

    const hasMore = startIndex + limit < scored.length;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ page: page + 1 })).toString('base64')
      : undefined;

    return { items, nextCursor };
  }

  // ═══════════════════════════════════════════════════════════════
  // SEARCH (unchanged except block fix)
  // ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Batch fetch boost + subscription status for all profiles in parallel.
 * Returns: [Set of boosted userIds, Map of userId → planId]
 */
async function batchGetStatus(
  coreRepo: BaseRepository,
  userIds: string[],
): Promise<[Set<string>, Map<string, string>]> {
  const now = new Date();
  const boostedIds = new Set<string>();
  const planMap = new Map<string, string>();

  // Fetch all in parallel (not sequential N+1)
  const results = await Promise.all(
    userIds.map(async (uid) => {
      const [boost, sub] = await Promise.all([
        coreRepo.get<{ expiresAt: string }>(`USER#${uid}`, 'BOOST#ACTIVE'),
        coreRepo.get<{ planId: string; status: string }>(`USER#${uid}`, 'SUBSCRIPTION#ACTIVE'),
      ]);
      return { uid, boost, sub };
    }),
  );

  for (const { uid, boost, sub } of results) {
    if (boost && new Date(boost.expiresAt) > now) {
      boostedIds.add(uid);
    }
    if (sub?.status === 'active') {
      planMap.set(uid, sub.planId);
    }
  }

  return [boostedIds, planMap];
}
