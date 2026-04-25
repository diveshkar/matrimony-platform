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
  // Billing cycle anchor — updated on each renewal. Used as the usage-reset
  // boundary so paid users get exactly 1 month of quota per payment.
  currentPeriodStart?: string;
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
  profileViewsPerMonth?: number;
  interestsPerMonth?: number;
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

    // Reverse-lookup index so Stripe webhooks (which only know the
    // stripeSubscriptionId) can find the userId without scanning the table.
    if (data.stripeSubscriptionId) {
      await this.put({
        PK: `STRIPE_SUB#${data.stripeSubscriptionId}`,
        SK: 'INDEX',
        userId: data.userId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        createdAt: data.createdAt,
      });
    }
  }

  async updateSubscription(userId: string, updates: Partial<SubscriptionRecord>): Promise<void> {
    await this.update(`USER#${userId}`, 'SUBSCRIPTION#ACTIVE', {
      ...updates,
      updatedAt: nowISO(),
    });
  }

  /**
   * O(1) reverse lookup from Stripe subscription id → userId.
   * Used by webhook handlers (invoice.paid, customer.subscription.deleted)
   * which only carry the Stripe id and need to find our user.
   */
  async findUserByStripeSubscriptionId(stripeSubId: string): Promise<string | null> {
    const record = await this.get<{ userId: string }>(
      `STRIPE_SUB#${stripeSubId}`,
      'INDEX',
    );
    return record?.userId || null;
  }

  /**
   * Remove the reverse-lookup index. Called on cancel/expire so a new
   * subscription with a (theoretically) recycled id wouldn't collide.
   */
  async deleteStripeSubscriptionIndex(stripeSubId: string): Promise<void> {
    await this.delete(`STRIPE_SUB#${stripeSubId}`, 'INDEX');
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
        profileViewsPerDay: -1,
        interestsPerDay: -1,
        profileViewsPerMonth: 10,
        interestsPerMonth: 5,
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
