import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { SafetyRepository } from '../repositories/safety-repository.js';
import { SubscriptionRepository } from '../../subscriptions/repositories/subscription-repository.js';
import { checkEntitlement } from '../../shared/middleware/entitlement-check.js';

const repo = new SafetyRepository();
const subRepo = new SubscriptionRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  await checkEntitlement(authedEvent.auth.userId, 'who_viewed_me');

  const views = await repo.getProfileViews(authedEvent.auth.userId);
  const sub = await subRepo.getSubscription(authedEvent.auth.userId);
  const planId = sub?.status === 'active' ? sub.planId : 'free';

  if (planId === 'silver') {
    return success({ count: views.length, items: [], tier: 'count_only' }, requestId);
  }

  return success({ count: views.length, items: views, tier: 'full' }, requestId);
}

export const main = createHandler(withAuth(handler));
