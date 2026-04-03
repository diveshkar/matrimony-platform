import { BaseRepository } from '../../shared/repositories/base-repository.js';

export interface DiscoveryProfile {
  PK: string;
  SK: string;
  userId: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  religion: string;
  caste?: string;
  motherTongue: string;
  education: string;
  occupation?: string;
  country: string;
  state?: string;
  city?: string;
  maritalStatus: string;
  primaryPhotoUrl?: string;
  profileCompletion: number;
  aboutMe?: string;
  lastActiveAt: string;
  // GSI keys for filtered queries
  GSI1PK?: string; // COUNTRY#<country>#GENDER#<gender>
  GSI1SK?: string; // AGE#<age>#<userId>
  GSI2PK?: string; // RELIGION#<religion>#GENDER#<gender>
  GSI2SK?: string; // AGE#<age>#<userId>
}

export class DiscoveryRepository extends BaseRepository {
  constructor() {
    super('discovery');
  }

  async upsertProjection(profile: DiscoveryProfile): Promise<void> {
    await this.put(profile as unknown as Record<string, unknown>);
  }

  async removeProjection(userId: string): Promise<void> {
    await this.delete(`PROFILE#${userId}`, 'DISCOVERY#v1');
  }

  async searchByCountryAndGender(
    country: string,
    gender: string,
    options: { limit?: number; exclusiveStartKey?: Record<string, unknown> },
  ): Promise<{ items: DiscoveryProfile[]; lastKey?: Record<string, unknown> }> {
    const gsiPk = `COUNTRY#${country}#GENDER#${gender}`;
    return this.query<DiscoveryProfile>(gsiPk, {
      indexName: 'GSI1',
      limit: options.limit || 20,
      exclusiveStartKey: options.exclusiveStartKey,
      scanForward: false,
    });
  }

  async searchByReligionAndGender(
    religion: string,
    gender: string,
    options: { limit?: number; exclusiveStartKey?: Record<string, unknown> },
  ): Promise<{ items: DiscoveryProfile[]; lastKey?: Record<string, unknown> }> {
    const gsiPk = `RELIGION#${religion}#GENDER#${gender}`;
    return this.query<DiscoveryProfile>(gsiPk, {
      indexName: 'GSI2',
      limit: options.limit || 20,
      exclusiveStartKey: options.exclusiveStartKey,
      scanForward: false,
    });
  }

  async getAllProfiles(limit = 50): Promise<{ items: DiscoveryProfile[]; lastKey?: Record<string, unknown> }> {
    // For MVP: scan-like approach using a known PK prefix
    // In production, always query via GSI
    return this.query<DiscoveryProfile>('DISCOVERY#ALL', {
      limit,
      scanForward: false,
    });
  }
}
