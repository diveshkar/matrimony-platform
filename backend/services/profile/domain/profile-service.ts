import { ProfileRepository } from '../repositories/profile-repository.js';
import { ConflictError, NotFoundError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';
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

    // Validate and register phone number
    const phoneNumber = data.phoneNumber as string | undefined;
    if (phoneNumber) {
      const { validatePhoneNumber } = await import('./phone-validation.js');
      const { ensurePhoneAvailable, registerPhone, getUserPhone } = await import('./phone-registry.js');

      const existingPhone = await getUserPhone(userId);
      if (!existingPhone || existingPhone !== phoneNumber) {
        await validatePhoneNumber(phoneNumber);
        await ensurePhoneAvailable(phoneNumber, userId);
        await registerPhone(userId, phoneNumber);
      }
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

    await this.repo.savePrivacy(userId, {
      hideWhatsapp: true,
      hideDob: false,
      photoVisibility: 'all',
      horoscopeVisibility: 'all',
      showInSearch: true,
    });

    await this.repo.markOnboardingComplete(userId);

    try {
      const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
      await new DiscoveryService().syncProfileToDiscovery(userId);
    } catch (err) {
      logger.warn('Failed to sync profile to discovery', { userId, error: String(err) });
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

    // Handle phone number change
    const newPhone = updates.phoneNumber as string | undefined;
    if (newPhone) {
      const { validatePhoneNumber } = await import('./phone-validation.js');
      const { changePhone, getUserPhone } = await import('./phone-registry.js');

      const currentPhone = await getUserPhone(userId);
      if (currentPhone !== newPhone) {
        await validatePhoneNumber(newPhone);
        await changePhone(userId, currentPhone, newPhone);
      }
      delete updates.phoneNumber;
    }

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

    if (viewerId && viewerId !== userId && privacy?.showInSearch === false) {
      throw new NotFoundError('Profile');
    }

    const publicProfile: Record<string, unknown> = { ...profile };
    delete publicProfile.PK;
    delete publicProfile.SK;

    // Add phone verified status
    const { getUserPhone } = await import('./phone-registry.js');
    publicProfile.phoneVerified = !!(await getUserPhone(userId));

    if (privacy?.hideWhatsapp) delete publicProfile.whatsappNumber;
    if (privacy?.hideDob) {
      delete publicProfile.dateOfBirth;
    }

    // Load user's photos
    const { PhotoRepository } = await import('../../uploads/repositories/photo-repository.js');
    const photoRepo = new PhotoRepository();
    const allPhotos = await photoRepo.getPhotos(userId);
    const visiblePhotos = allPhotos.filter((p) => p.visibility === 'all' || p.isPrimary);

    // Determine how many photos the viewer can see based on plan
    const PHOTO_VIEW_LIMITS: Record<string, number> = { free: 1, silver: 4, gold: 99, platinum: 99 };
    let viewerPlan = 'free';
    let photoViewLimit = 1;

    if (viewerId && viewerId !== userId) {
      try {
        const { getRemainingUsage } = await import('../../shared/middleware/entitlement-check.js');
        const { SubscriptionRepository } = await import('../../subscriptions/repositories/subscription-repository.js');
        const usage = await getRemainingUsage(viewerId);
        const subRepo = new SubscriptionRepository();
        const viewerSub = await subRepo.getSubscription(viewerId);
        viewerPlan = viewerSub?.status === 'active' ? viewerSub.planId : 'free';
        photoViewLimit = PHOTO_VIEW_LIMITS[viewerPlan] || 1;

        publicProfile.contactInfoVisible = usage.contactInfoAccess;
        if (!usage.contactInfoAccess) {
          delete publicProfile.whatsappNumber;
          delete publicProfile.personalEmail;
        }
      } catch {
        publicProfile.contactInfoVisible = false;
      }
    } else {
      photoViewLimit = 99; // own profile sees all
    }

    // Return photos: visible ones up to limit, rest marked as locked
    const sortedPhotos = visiblePhotos.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    publicProfile.photos = sortedPhotos.map((p, i) => ({
      photoId: p.photoId,
      url: i < photoViewLimit ? p.url : '',
      isPrimary: p.isPrimary,
      locked: i >= photoViewLimit,
    }));
    publicProfile.photoViewLimit = photoViewLimit;
    publicProfile.totalPhotos = sortedPhotos.length;

    if (viewerId && viewerId !== userId) {
      try {
        const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
        const coreRepo = new BaseRepository('core');

        const sentInterest = await coreRepo.get<{ status: string }>(
          `USER#${viewerId}`,
          `INTEREST#OUT#${userId}`,
        );

        const receivedInterest = await coreRepo.get<{ status: string }>(
          `USER#${viewerId}`,
          `INTEREST#IN#${userId}`,
        );

        if (sentInterest) {
          publicProfile.interestStatus = sentInterest.status;
        } else if (receivedInterest) {
          if (receivedInterest.status === 'accepted') {
            publicProfile.interestStatus = 'accepted';
          } else if (receivedInterest.status === 'declined') {
            publicProfile.interestStatus = 'none';
          } else {
            publicProfile.interestStatus = 'received';
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
