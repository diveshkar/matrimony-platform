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

export function getRelatedCastes(caste: string): string[] {
  const group = casteToGroup.get(caste.toLowerCase());
  if (!group) return [];
  return CASTE_GROUPS[group].filter((c) => c.toLowerCase() !== caste.toLowerCase());
}

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

export function scoreAgeProximity(viewerAge: number, candidateAge: number): number {
  const diff = Math.abs(viewerAge - candidateAge);
  return Math.max(0, 16 - diff * 2);
}

export function scoreLocation(
  viewer: { city?: string; state?: string; country?: string },
  candidate: { city?: string; state?: string; country?: string },
): number {
  if (viewer.city && candidate.city && viewer.city.toLowerCase() === candidate.city.toLowerCase()) return 12;
  if (viewer.state && candidate.state && viewer.state.toLowerCase() === candidate.state.toLowerCase()) return 8;
  if (viewer.country && candidate.country && viewer.country.toLowerCase() === candidate.country.toLowerCase()) return 4;
  return 0;
}

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

  if (dimensionsSet === 0) return 6;

  return score;
}

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

export function scoreEducation(
  candidateEducation: string,
  preferredEducations?: string[],
): number {
  if (!preferredEducations?.length) return 3;
  return preferredEducations.includes(candidateEducation) ? 6 : 0;
}

export function scoreQuality(profile: {
  primaryPhotoUrl?: string;
  phoneVerified?: boolean;
  profileCompletion: number;
}): number {
  let score = 0;
  if (profile.primaryPhotoUrl) score += 2;
  if (profile.phoneVerified) score += 2;
  score += Math.min(2, Math.floor(profile.profileCompletion / 50));
  return score;
}

export function scoreRecency(lastActiveAt?: string): number {
  if (!lastActiveAt) return 0;
  const hours = (Date.now() - new Date(lastActiveAt).getTime()) / 3_600_000;
  if (hours < 24) return 4;
  if (hours < 72) return 3;
  if (hours < 168) return 2;
  if (hours < 720) return 1;
  return 0;
}
