import { ProfileRepository } from '../repositories/profile-repository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/app-errors.js';
import type {
  UserProfile,
  UserPreference,
  UserPrivacy,
} from '../../../packages/shared-types/index.js';

function calculateCompletion(profile: Partial<UserProfile>): number {
  const fields = [
    'name',
    'dateOfBirth',
    'gender',
    'height',
    'maritalStatus',
    'religion',
    'motherTongue',
    'education',
    'country',
    'aboutMe',
    'primaryPhotoUrl',
  ];
  const optional = [
    'caste',
    'occupation',
    'city',
    'fatherOccupation',
    'motherOccupation',
    'familyType',
    'familyValues',
  ];

  let filled = 0;
  const total = fields.length + optional.length;

  for (const f of fields) {
    if (profile[f as keyof UserProfile]) filled++;
  }
  for (const f of optional) {
    if (profile[f as keyof UserProfile]) filled++;
  }

  return Math.round((filled / total) * 100);
}

export class ProfileService {
  private repo: ProfileRepository;

  constructor() {
    this.repo = new ProfileRepository();
  }

  async createProfile(userId: string, data: Record<string, unknown>): Promise<UserProfile> {
    const existing = await this.repo.getProfile(userId);
    if (existing) {
      throw new ConflictError('Profile already exists. Use update instead.');
    }

    const profileData = {
      profileFor: data.profileFor as UserProfile['profileFor'],
      name: data.name as string,
      dateOfBirth: data.dateOfBirth as string,
      gender: data.gender as UserProfile['gender'],
      height: data.height as number,
      maritalStatus: data.maritalStatus as UserProfile['maritalStatus'],
      hasChildren: (data.hasChildren as boolean) || false,
      childrenCount: data.childrenCount as number | undefined,
      religion: data.religion as string,
      caste: data.caste as string | undefined,
      subCaste: data.subCaste as string | undefined,
      denomination: data.denomination as string | undefined,
      motherTongue: data.motherTongue as string,
      gothram: data.gothram as string | undefined,
      education: data.education as string,
      educationField: data.educationField as string | undefined,
      occupation: data.occupation as string | undefined,
      employer: data.employer as string | undefined,
      incomeRange: data.incomeRange as string | undefined,
      country: data.country as string,
      state: data.state as string | undefined,
      city: data.city as string | undefined,
      fatherOccupation: data.fatherOccupation as string | undefined,
      motherOccupation: data.motherOccupation as string | undefined,
      brothersCount: data.brothersCount as number | undefined,
      brothersMarried: data.brothersMarried as number | undefined,
      sistersCount: data.sistersCount as number | undefined,
      sistersMarried: data.sistersMarried as number | undefined,
      familyType: data.familyType as UserProfile['familyType'],
      familyStatus: data.familyStatus as UserProfile['familyStatus'],
      familyValues: data.familyValues as UserProfile['familyValues'],
      aboutMe: data.aboutMe as string | undefined,
      primaryPhotoUrl: undefined,
      profileCompletion: 0,
    };

    profileData.profileCompletion = calculateCompletion(profileData);

    const profile = await this.repo.createProfile(userId, profileData);

    // Save preferences if provided
    if (data.preferences) {
      const prefs = data.preferences as Record<string, unknown>;
      await this.repo.savePreferences(userId, {
        ageMin: (prefs.ageMin as number) || 18,
        ageMax: (prefs.ageMax as number) || 45,
        heightMin: prefs.heightMin as number | undefined,
        heightMax: prefs.heightMax as number | undefined,
        religions: prefs.religions as string[] | undefined,
        castes: prefs.castes as string[] | undefined,
        educations: prefs.educations as string[] | undefined,
        occupations: prefs.occupations as string[] | undefined,
        countries: prefs.countries as string[] | undefined,
        maritalStatuses: prefs.maritalStatuses as string[] | undefined,
      });
    }

    // Create default privacy settings
    await this.repo.savePrivacy(userId, {
      hidePhone: true,
      hideDob: false,
      photoVisibility: 'all',
      horoscopeVisibility: 'all',
      showInSearch: true,
    });

    // Mark onboarding complete
    await this.repo.markOnboardingComplete(userId);

    // Sync to discovery table
    try {
      const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
      await new DiscoveryService().syncProfileToDiscovery(userId);
    } catch {
      // Non-critical — discovery sync can happen later
    }

    return profile;
  }

  async getMyProfile(userId: string): Promise<{
    profile: UserProfile;
    preferences: UserPreference | null;
    privacy: UserPrivacy | null;
  }> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const [preferences, privacy] = await Promise.all([
      this.repo.getPreferences(userId),
      this.repo.getPrivacy(userId),
    ]);

    return { profile, preferences, privacy };
  }

  async updateProfile(
    userId: string,
    updates: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const existing = await this.repo.getProfile(userId);
    if (!existing) {
      throw new NotFoundError('Profile');
    }

    // Separate preferences from profile updates
    const { preferences, ...profileUpdates } = updates;

    let result = {};
    if (Object.keys(profileUpdates).length > 0) {
      const merged = { ...existing, ...profileUpdates };
      profileUpdates.profileCompletion = calculateCompletion(merged as Partial<UserProfile>);
      result = await this.repo.updateProfile(userId, profileUpdates);
    }

    if (preferences) {
      const prefs = preferences as Record<string, unknown>;
      await this.repo.savePreferences(userId, {
        ageMin: (prefs.ageMin as number) || 18,
        ageMax: (prefs.ageMax as number) || 45,
        heightMin: prefs.heightMin as number | undefined,
        heightMax: prefs.heightMax as number | undefined,
        religions: prefs.religions as string[] | undefined,
        castes: prefs.castes as string[] | undefined,
        educations: prefs.educations as string[] | undefined,
        occupations: prefs.occupations as string[] | undefined,
        countries: prefs.countries as string[] | undefined,
        maritalStatuses: prefs.maritalStatuses as string[] | undefined,
      });
    }

    return result;
  }

  async getPublicProfile(userId: string, viewerId?: string): Promise<Record<string, unknown>> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const privacy = await this.repo.getPrivacy(userId);

    // Strip private fields
    const publicProfile: Record<string, unknown> = { ...profile };
    delete publicProfile.PK;
    delete publicProfile.SK;

    if (privacy?.hidePhone) delete publicProfile.phone;
    if (privacy?.hideDob) {
      delete publicProfile.dateOfBirth;
    }

    // Check if viewer has contact info access (Gold+ plan)
    if (viewerId && viewerId !== userId) {
      try {
        const { getRemainingUsage } = await import('../../shared/middleware/entitlement-check.js');
        const usage = await getRemainingUsage(viewerId);
        publicProfile.contactInfoVisible = usage.contactInfoAccess;
        if (!usage.contactInfoAccess) {
          delete publicProfile.phone;
          delete publicProfile.email;
        }
      } catch {
        publicProfile.contactInfoVisible = false;
      }
    }

    // Check interest status between viewer and profile owner
    if (viewerId && viewerId !== userId) {
      try {
        const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
        const coreRepo = new BaseRepository('core');

        // Check if viewer sent interest to this profile
        const sentInterest = await coreRepo.get<{ status: string }>(
          `USER#${viewerId}`,
          `INTEREST#OUT#${userId}`,
        );

        // Check if this profile sent interest to viewer
        const receivedInterest = await coreRepo.get<{ status: string }>(
          `USER#${viewerId}`,
          `INTEREST#IN#${userId}`,
        );

        if (sentInterest) {
          // I sent interest to them
          publicProfile.interestStatus = sentInterest.status; // pending, accepted, declined
        } else if (receivedInterest) {
          // They sent interest to me
          if (receivedInterest.status === 'accepted') {
            publicProfile.interestStatus = 'accepted'; // mutual — show Chat Now
          } else if (receivedInterest.status === 'declined') {
            publicProfile.interestStatus = 'none'; // I declined them — allow re-interaction
          } else {
            publicProfile.interestStatus = 'received'; // pending — show Accept/Decline
          }
        } else {
          publicProfile.interestStatus = 'none';
        }
      } catch {
        publicProfile.interestStatus = 'none';
      }
    }

    return publicProfile;
  }
}
