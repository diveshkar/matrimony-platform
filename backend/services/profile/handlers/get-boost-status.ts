import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { SubscriptionRepository } from '../../subscriptions/repositories/subscription-repository.js';

const coreRepo = new BaseRepository('core');
const subRepo = new SubscriptionRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const userId = authedEvent.auth.userId;

  const entitlement = await subRepo.getUserEntitlement(userId);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const usageRecord = await coreRepo.get<{ count: number }>(
    `USER#${userId}`,
    `BOOST_USAGE#${monthKey}`,
  );

  const activeBoost = await coreRepo.get<{ expiresAt: string }>(
    `USER#${userId}`,
    'BOOST#ACTIVE',
  );

  const isActive = activeBoost ? new Date(activeBoost.expiresAt) > now : false;

  return success({
    isActive,
    expiresAt: isActive ? activeBoost!.expiresAt : null,
    boostsUsed: usageRecord?.count || 0,
    boostsTotal: entitlement.boostsPerMonth,
    canBoost: entitlement.boostsPerMonth > 0 && (usageRecord?.count || 0) < entitlement.boostsPerMonth && !isActive,
  }, requestId);
}

export const main = createHandler(withAuth(handler));
