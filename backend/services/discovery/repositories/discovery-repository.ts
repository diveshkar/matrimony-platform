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
  phoneVerified?: boolean;
  lastActiveAt: string;
  createdAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
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

  async searchByCasteAndGender(
    caste: string,
    gender: string,
    options: { limit?: number },
  ): Promise<{ items: DiscoveryProfile[]; lastKey?: Record<string, unknown> }> {
    const gsiPk = `CASTE#${caste}#GENDER#${gender}`;
    return this.query<DiscoveryProfile>(gsiPk, {
      indexName: 'GSI3',
      limit: options.limit || 20,
      scanForward: false,
    });
  }

  async getAllProfiles(
    limit = 50,
  ): Promise<{ items: DiscoveryProfile[]; lastKey?: Record<string, unknown> }> {
    return this.query<DiscoveryProfile>('DISCOVERY#ALL', {
      limit,
      scanForward: false,
    });
  }

  async getProfilesByIds(userIds: string[]): Promise<Map<string, DiscoveryProfile>> {
    const results = await Promise.all(
      userIds.map(async (id) => {
        const profile = await this.get<DiscoveryProfile>(`PROFILE#${id}`, 'DISCOVERY#v1');
        return { id, profile };
      }),
    );

    const map = new Map<string, DiscoveryProfile>();
    for (const { id, profile } of results) {
      if (profile) map.set(id, profile);
    }
    return map;
  }
}
