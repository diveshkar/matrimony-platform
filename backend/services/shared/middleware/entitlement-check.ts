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

function monthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getUsage(userId: string, action: string, period: string): Promise<number> {
  const item = await coreRepo.get<UsageRecord>(`USAGE#${userId}`, `${action}#${period}`);
  return item?.count || 0;
}

async function checkAndIncrementUsage(
  userId: string,
  action: string,
  dailyLimit: number,
  monthlyLimit: number,
): Promise<void> {
  if (dailyLimit !== -1) {
    const date = todayKey();
    const result = await coreRepo.incrementIfBelow(`USAGE#${userId}`, `${action}#${date}`, 'count', dailyLimit, {
      date,
      ttl: Math.floor(Date.now() / 1000) + 86400 * 2,
      createdAt: nowISO(),
    });
    if (!result.success) {
      throw new ForbiddenError(`You have reached your daily limit (${dailyLimit}). Upgrade for more.`);
    }
    return;
  }

  if (monthlyLimit !== -1) {
    const month = monthKey();
    const result = await coreRepo.incrementIfBelow(`USAGE#${userId}`, `${action}#${month}`, 'count', monthlyLimit, {
      month,
      ttl: Math.floor(Date.now() / 1000) + 86400 * 35,
      createdAt: nowISO(),
    });
    if (!result.success) {
      throw new ForbiddenError(`You have reached your monthly limit (${monthlyLimit}). Resets next month.`);
    }
    return;
  }
}

export async function checkEntitlement(
  userId: string,
  action: 'profile_view' | 'send_interest' | 'chat_access' | 'who_viewed_me' | 'contact_info',
): Promise<void> {
  const entitlement = await subRepo.getUserEntitlement(userId);

  switch (action) {
    case 'profile_view': {
      const daily = entitlement.profileViewsPerDay;
      const monthly = entitlement.profileViewsPerMonth ?? -1;
      if (daily === -1 && monthly === -1) return;
      await checkAndIncrementUsage(userId, 'profile_view', daily, monthly);
      return;
    }

    case 'send_interest': {
      const daily = entitlement.interestsPerDay;
      const monthly = entitlement.interestsPerMonth ?? -1;
      if (daily === -1 && monthly === -1) return;
      await checkAndIncrementUsage(userId, 'send_interest', daily, monthly);
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
  profileViewsPeriod: 'day' | 'month';
  interestsPeriod: 'day' | 'month';
  chatAccess: boolean;
  whoViewedMeAccess: boolean;
  contactInfoAccess: boolean;
}> {
  const entitlement = await subRepo.getUserEntitlement(userId);

  const viewsDaily = entitlement.profileViewsPerDay;
  const viewsMonthly = entitlement.profileViewsPerMonth ?? -1;
  const interestsDaily = entitlement.interestsPerDay;
  const interestsMonthly = entitlement.interestsPerMonth ?? -1;

  let profileViewsRemaining = -1;
  let profileViewsPeriod: 'day' | 'month' = 'day';
  if (viewsDaily !== -1) {
    const used = await getUsage(userId, 'profile_view', todayKey());
    profileViewsRemaining = Math.max(0, viewsDaily - used);
    profileViewsPeriod = 'day';
  } else if (viewsMonthly !== -1) {
    const used = await getUsage(userId, 'profile_view', monthKey());
    profileViewsRemaining = Math.max(0, viewsMonthly - used);
    profileViewsPeriod = 'month';
  }

  let interestsRemaining = -1;
  let interestsPeriod: 'day' | 'month' = 'day';
  if (interestsDaily !== -1) {
    const used = await getUsage(userId, 'send_interest', todayKey());
    interestsRemaining = Math.max(0, interestsDaily - used);
    interestsPeriod = 'day';
  } else if (interestsMonthly !== -1) {
    const used = await getUsage(userId, 'send_interest', monthKey());
    interestsRemaining = Math.max(0, interestsMonthly - used);
    interestsPeriod = 'month';
  }

  return {
    profileViewsRemaining,
    interestsRemaining,
    profileViewsPeriod,
    interestsPeriod,
    chatAccess: entitlement.chatAccess,
    whoViewedMeAccess: entitlement.whoViewedMeAccess,
    contactInfoAccess: entitlement.contactInfoAccess,
  };
}
