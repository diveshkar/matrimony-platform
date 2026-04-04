import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';

export interface SubscriptionRecord {
  PK: string;
  SK: string;
  userId: string;
  planId: 'free' | 'silver' | 'gold' | 'platinum';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired';
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementRecord {
  PK: string;
  SK: string;
  planId: string;
  profileViewsPerDay: number;
  interestsPerDay: number;
  chatAccess: boolean;
  contactInfoAccess: boolean;
  whoViewedMeAccess: boolean;
  boostsPerMonth: number;
  schemaVersion: number;
}

export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  async getSubscription(userId: string): Promise<SubscriptionRecord | null> {
    return this.get<SubscriptionRecord>(`USER#${userId}`, 'SUBSCRIPTION#ACTIVE');
  }

  async saveSubscription(data: Omit<SubscriptionRecord, 'PK' | 'SK'>): Promise<void> {
    await this.put({
      PK: `USER#${data.userId}`,
      SK: 'SUBSCRIPTION#ACTIVE',
      ...data,
    });
  }

  async updateSubscription(userId: string, updates: Partial<SubscriptionRecord>): Promise<void> {
    await this.update(`USER#${userId}`, 'SUBSCRIPTION#ACTIVE', {
      ...updates,
      updatedAt: nowISO(),
    });
  }

  async getEntitlement(planId: string): Promise<EntitlementRecord | null> {
    return this.get<EntitlementRecord>(`PLAN#${planId}`, 'ENTITLEMENT#v1');
  }

  async getUserEntitlement(userId: string): Promise<EntitlementRecord> {
    const sub = await this.getSubscription(userId);
    const planId = sub?.status === 'active' ? sub.planId : 'free';
    const entitlement = await this.getEntitlement(planId);

    if (!entitlement) {
      return {
        PK: 'PLAN#free',
        SK: 'ENTITLEMENT#v1',
        planId: 'free',
        profileViewsPerDay: 10,
        interestsPerDay: 5,
        chatAccess: false,
        contactInfoAccess: false,
        whoViewedMeAccess: false,
        boostsPerMonth: 0,
        schemaVersion: 1,
      };
    }

    return entitlement;
  }
}
