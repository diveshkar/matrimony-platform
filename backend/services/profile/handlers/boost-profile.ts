import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ForbiddenError, ValidationError } from '../../shared/errors/app-errors.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { SubscriptionRepository } from '../../subscriptions/repositories/subscription-repository.js';
import { logger } from '../../shared/utils/logger.js';

const coreRepo = new BaseRepository('core');
const subRepo = new SubscriptionRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const entitlement = await subRepo.getUserEntitlement(userId);
  if (entitlement.boostsPerMonth <= 0) {
    throw new ForbiddenError('Profile boost is available on Gold plan and above. Upgrade to boost your profile.');
  }

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const usageRecord = await coreRepo.get<{ count: number }>(
    `USER#${userId}`,
    `BOOST_USAGE#${monthKey}`,
  );
  const usedThisMonth = usageRecord?.count || 0;

  if (usedThisMonth >= entitlement.boostsPerMonth) {
    throw new ValidationError(
      `You've used all ${entitlement.boostsPerMonth} boost${entitlement.boostsPerMonth > 1 ? 's' : ''} this month. Resets next month.`,
    );
  }

  const activeBoost = await coreRepo.get<{ expiresAt: string }>(
    `USER#${userId}`,
    'BOOST#ACTIVE',
  );
  if (activeBoost) {
    const expiresAt = new Date(activeBoost.expiresAt);
    if (expiresAt > now) {
      const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 3600000);
      throw new ValidationError(`Your profile is already boosted. ${hoursLeft} hours remaining.`);
    }
  }

  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await coreRepo.put({
    PK: `USER#${userId}`,
    SK: 'BOOST#ACTIVE',
    userId,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ttl: Math.floor(expiresAt.getTime() / 1000) + 3600,
  });

  if (usageRecord) {
    await coreRepo.update(`USER#${userId}`, `BOOST_USAGE#${monthKey}`, {
      count: usedThisMonth + 1,
    });
  } else {
    await coreRepo.put({
      PK: `USER#${userId}`,
      SK: `BOOST_USAGE#${monthKey}`,
      count: 1,
      monthKey,
      ttl: Math.floor(Date.now() / 1000) + 86400 * 60,
    });
  }

  logger.info('Profile boosted', { userId, expiresAt: expiresAt.toISOString(), usedThisMonth: usedThisMonth + 1 });

  return success({
    status: 'boosted',
    expiresAt: expiresAt.toISOString(),
    boostsUsed: usedThisMonth + 1,
    boostsTotal: entitlement.boostsPerMonth,
  }, requestId);
}

export const main = createHandler(withAuth(handler));
