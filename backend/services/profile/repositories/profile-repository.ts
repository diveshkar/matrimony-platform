import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import type {
  UserProfile,
  UserPreference,
  UserPrivacy,
} from '../../../packages/shared-types/index.js';

export class ProfileRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.get<UserProfile>(`USER#${userId}`, 'PROFILE#v1');
  }

  async createProfile(
    userId: string,
    data: Omit<UserProfile, 'PK' | 'SK' | 'userId' | 'schemaVersion' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserProfile> {
    const now = nowISO();
    const profile: UserProfile = {
      PK: `USER#${userId}`,
      SK: 'PROFILE#v1',
      userId,
      ...data,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.put(profile as unknown as Record<string, unknown>);
    return profile;
  }

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<Record<string, unknown>> {
    return this.update(`USER#${userId}`, 'PROFILE#v1', {
      ...updates,
      updatedAt: nowISO(),
    });
  }

  async getPreferences(userId: string): Promise<UserPreference | null> {
    return this.get<UserPreference>(`USER#${userId}`, 'PREFERENCE#v1');
  }

  async savePreferences(
    userId: string,
    data: Omit<
      UserPreference,
      'PK' | 'SK' | 'userId' | 'schemaVersion' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<void> {
    const now = nowISO();
    await this.put({
      PK: `USER#${userId}`,
      SK: 'PREFERENCE#v1',
      userId,
      ...data,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getPrivacy(userId: string): Promise<UserPrivacy | null> {
    return this.get<UserPrivacy>(`USER#${userId}`, 'PRIVACY#v1');
  }

  async savePrivacy(
    userId: string,
    data: Omit<UserPrivacy, 'PK' | 'SK' | 'userId' | 'schemaVersion' | 'updatedAt'>,
  ): Promise<void> {
    await this.put({
      PK: `USER#${userId}`,
      SK: 'PRIVACY#v1',
      userId,
      ...data,
      schemaVersion: 1,
      updatedAt: nowISO(),
    });
  }

  async markOnboardingComplete(userId: string): Promise<void> {
    await this.update(`USER#${userId}`, 'ACCOUNT#v1', {
      hasProfile: true,
      onboardingComplete: true,
      updatedAt: nowISO(),
    });
  }
}
