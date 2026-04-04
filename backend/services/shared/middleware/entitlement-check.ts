import { SubscriptionRepository } from '../../subscriptions/repositories/subscription-repository.js';
import { BaseRepository } from '../repositories/base-repository.js';
import { ForbiddenError } from '../errors/app-errors.js';
import { nowISO } from '../utils/date.js';

const subRepo = new SubscriptionRepository();
const coreRepo = new BaseRepository('core');

interface UsageRecord {
  PK: string;
  SK: string;
  count: number;
  date: string;
  ttl: number;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

async function getDailyUsage(userId: string, action: string): Promise<number> {
  const date = todayKey();
  const item = await coreRepo.get<UsageRecord>(`USAGE#${userId}`, `${action}#${date}`);
  return item?.count || 0;
}

async function incrementDailyUsage(userId: string, action: string): Promise<void> {
  const date = todayKey();
  const pk = `USAGE#${userId}`;
  const sk = `${action}#${date}`;
  const existing = await coreRepo.get<UsageRecord>(pk, sk);

  const ttl = Math.floor(Date.now() / 1000) + 86400 * 2;

  if (existing) {
    await coreRepo.update(pk, sk, { count: (existing.count || 0) + 1 });
  } else {
    await coreRepo.put({ PK: pk, SK: sk, count: 1, date, ttl, createdAt: nowISO() });
  }
}

export async function checkEntitlement(
  userId: string,
  action: 'profile_view' | 'send_interest' | 'chat_access' | 'who_viewed_me' | 'contact_info',
): Promise<void> {
  const entitlement = await subRepo.getUserEntitlement(userId);

  switch (action) {
    case 'profile_view': {
      const limit = entitlement.profileViewsPerDay;
      if (limit === -1) return;
      const used = await getDailyUsage(userId, 'profile_view');
      if (used >= limit) {
        throw new ForbiddenError(
          `You have reached your daily profile view limit (${limit}). Upgrade your plan to view more profiles.`,
        );
      }
      await incrementDailyUsage(userId, 'profile_view');
      return;
    }

    case 'send_interest': {
      const limit = entitlement.interestsPerDay;
      if (limit === -1) return;
      const used = await getDailyUsage(userId, 'send_interest');
      if (used >= limit) {
        throw new ForbiddenError(
          `You have reached your daily interest limit (${limit}). Upgrade your plan to send more interests.`,
        );
      }
      await incrementDailyUsage(userId, 'send_interest');
      return;
    }

    case 'chat_access': {
      if (!entitlement.chatAccess) {
        throw new ForbiddenError(
          'Chat is available on Silver plan and above. Upgrade to start messaging.',
        );
      }
      return;
    }

    case 'who_viewed_me': {
      if (!entitlement.whoViewedMeAccess) {
        throw new ForbiddenError(
          'Who Viewed Me is available on Silver plan and above. Upgrade to see who viewed your profile.',
        );
      }
      return;
    }

    case 'contact_info': {
      if (!entitlement.contactInfoAccess) {
        throw new ForbiddenError(
          'Contact information is available on Gold plan and above. Upgrade to view contact details.',
        );
      }
      return;
    }
  }
}

export async function getRemainingUsage(userId: string): Promise<{
  profileViewsRemaining: number;
  interestsRemaining: number;
  chatAccess: boolean;
  whoViewedMeAccess: boolean;
  contactInfoAccess: boolean;
}> {
  const entitlement = await subRepo.getUserEntitlement(userId);

  const [viewsUsed, interestsUsed] = await Promise.all([
    getDailyUsage(userId, 'profile_view'),
    getDailyUsage(userId, 'send_interest'),
  ]);

  return {
    profileViewsRemaining:
      entitlement.profileViewsPerDay === -1
        ? -1
        : Math.max(0, entitlement.profileViewsPerDay - viewsUsed),
    interestsRemaining:
      entitlement.interestsPerDay === -1
        ? -1
        : Math.max(0, entitlement.interestsPerDay - interestsUsed),
    chatAccess: entitlement.chatAccess,
    whoViewedMeAccess: entitlement.whoViewedMeAccess,
    contactInfoAccess: entitlement.contactInfoAccess,
  };
}
