export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ═══════════════════════════════════════════════════════════════
// CASTE COMPATIBILITY GROUPS (Tamil matrimony context)
// ═══════════════════════════════════════════════════════════════

export const CASTE_GROUPS: Record<string, string[]> = {
  Brahmin: ['Iyer', 'Iyengar'],
  Agricultural: ['Vellalar', 'Pillai', 'Mudaliar', 'Gounder', 'Naicker'],
  Trading: ['Chettiar', 'Nadar'],
  Warrior: ['Thevar', 'Maravar', 'Kallar'],
};

const casteToGroup = new Map<string, string>();
for (const [group, castes] of Object.entries(CASTE_GROUPS)) {
  for (const caste of castes) {
    casteToGroup.set(caste.toLowerCase(), group);
  }
}

/**
 * Get all castes in the same compatibility group as the given caste.
 * Returns only the OTHER castes (excludes the input caste itself).
 * Returns empty array if caste is not in any group.
 */
export function getRelatedCastes(caste: string): string[] {
  const group = casteToGroup.get(caste.toLowerCase());
  if (!group) return [];
  return CASTE_GROUPS[group].filter((c) => c.toLowerCase() !== caste.toLowerCase());
}

/**
 * Score caste compatibility between two profiles.
 * - Exact match: 13 (full points)
 * - Same compatibility group: 9
 * - One or both castes not specified / not in any group: 3 (neutral)
 * - Different groups: 0
 */
export function scoreCasteMatch(casteA?: string, casteB?: string): number {
  if (!casteA || !casteB) return 3;

  const normalA = casteA.toLowerCase();
  const normalB = casteB.toLowerCase();

  if (normalA === normalB) return 13;

  const groupA = casteToGroup.get(normalA);
  const groupB = casteToGroup.get(normalB);

  if (!groupA || !groupB) return 3;
  if (groupA === groupB) return 9;

  return 0;
}

/**
 * Score age proximity between viewer and candidate.
 * 0 diff → 16, 1 → 14, 2 → 12, 3 → 10, 4 → 8, 5 → 6, 6 → 4, 7 → 2, 8+ → 0
 */
export function scoreAgeProximity(viewerAge: number, candidateAge: number): number {
  const diff = Math.abs(viewerAge - candidateAge);
  return Math.max(0, 16 - diff * 2);
}

/**
 * Score location match (tiered).
 * Same city: 12, Same state: 8, Same country: 4, Different: 0
 */
export function scoreLocation(
  viewer: { city?: string; state?: string; country?: string },
  candidate: { city?: string; state?: string; country?: string },
): number {
  if (viewer.city && candidate.city && viewer.city.toLowerCase() === candidate.city.toLowerCase()) return 12;
  if (viewer.state && candidate.state && viewer.state.toLowerCase() === candidate.state.toLowerCase()) return 8;
  if (viewer.country && candidate.country && viewer.country.toLowerCase() === candidate.country.toLowerCase()) return 4;
  return 0;
}

/**
 * Score religion match.
 * Exact match with preference: 12, Same as viewer (no preference set): 6, Different: 0
 */
export function scoreReligion(
  candidateReligion: string,
  viewerReligion: string,
  preferredReligions?: string[],
): number {
  if (preferredReligions?.length) {
    return preferredReligions.includes(candidateReligion) ? 12 : 0;
  }
  return candidateReligion === viewerReligion ? 6 : 0;
}

export interface CandidatePreferences {
  ageMin?: number;
  ageMax?: number;
  religions?: string[];
  castes?: string[];
  educations?: string[];
  countries?: string[];
  maritalStatuses?: string[];
}

/**
 * Mutual compatibility: does the candidate's preferences match the viewer?
 * Checks age, religion, caste, education, country, marital status.
 * Each matching dimension adds points; total capped at 12.
 *
 * 6 dimensions checked → 2 points each = 12 max.
 * If candidate has no preferences set at all → 6 (neutral, don't penalize).
 */
export function scoreMutualCompatibility(
  viewerProfile: {
    age: number;
    religion: string;
    caste?: string;
    education: string;
    country: string;
    maritalStatus: string;
  },
  candidatePrefs?: CandidatePreferences | null,
): number {
  if (!candidatePrefs) return 6;

  let score = 0;
  let dimensionsSet = 0;

  if (candidatePrefs.ageMin !== undefined || candidatePrefs.ageMax !== undefined) {
    dimensionsSet++;
    const min = candidatePrefs.ageMin ?? 0;
    const max = candidatePrefs.ageMax ?? 200;
    if (viewerProfile.age >= min && viewerProfile.age <= max) score += 2;
  }

  if (candidatePrefs.religions?.length) {
    dimensionsSet++;
    if (candidatePrefs.religions.includes(viewerProfile.religion)) score += 2;
  }

  if (candidatePrefs.castes?.length) {
    dimensionsSet++;
    if (viewerProfile.caste && candidatePrefs.castes.includes(viewerProfile.caste)) score += 2;
  }

  if (candidatePrefs.educations?.length) {
    dimensionsSet++;
    if (candidatePrefs.educations.includes(viewerProfile.education)) score += 2;
  }

  if (candidatePrefs.countries?.length) {
    dimensionsSet++;
    if (candidatePrefs.countries.includes(viewerProfile.country)) score += 2;
  }

  if (candidatePrefs.maritalStatuses?.length) {
    dimensionsSet++;
    if (candidatePrefs.maritalStatuses.includes(viewerProfile.maritalStatus)) score += 2;
  }

  // If candidate set no preferences at all, give neutral score
  if (dimensionsSet === 0) return 6;

  return score;
}

/**
 * Score marital status match.
 * Exact match with preference: 7, Same as viewer (no pref): 4, Different: 0
 */
export function scoreMaritalStatus(
  candidateStatus: string,
  viewerStatus: string,
  preferredStatuses?: string[],
): number {
  if (preferredStatuses?.length) {
    return preferredStatuses.includes(candidateStatus) ? 7 : 0;
  }
  return candidateStatus === viewerStatus ? 4 : 0;
}

/**
 * Score education match.
 * Match with preference: 6, Different: 0
 * No preference set: 3 (neutral)
 */
export function scoreEducation(
  candidateEducation: string,
  preferredEducations?: string[],
): number {
  if (!preferredEducations?.length) return 3;
  return preferredEducations.includes(candidateEducation) ? 6 : 0;
}

/**
 * Profile quality signals (max 6).
 * Photo: 2, Phone verified: 2, Completion bonus: 0-2
 */
export function scoreQuality(profile: {
  primaryPhotoUrl?: string;
  phoneVerified?: boolean;
  profileCompletion: number;
}): number {
  let score = 0;
  if (profile.primaryPhotoUrl) score += 2;
  if (profile.phoneVerified) score += 2;
  // 0-100 completion → 0-2 points
  score += Math.min(2, Math.floor(profile.profileCompletion / 50));
  return score;
}

/**
 * Recency bonus (max 4).
 * Active <24h: 4, <72h: 3, <168h (1 week): 2, <720h (30 days): 1, else: 0
 */
export function scoreRecency(lastActiveAt?: string): number {
  if (!lastActiveAt) return 0;
  const hours = (Date.now() - new Date(lastActiveAt).getTime()) / 3_600_000;
  if (hours < 24) return 4;
  if (hours < 72) return 3;
  if (hours < 168) return 2;
  if (hours < 720) return 1;
  return 0;
}
