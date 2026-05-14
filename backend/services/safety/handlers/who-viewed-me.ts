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
  const planId = await subRepo.getEffectivePlan(authedEvent.auth.userId);

  if (planId === 'silver') {
    return success({ count: views.length, items: [], tier: 'count_only' }, requestId);
  }

  const enrichedViews = await Promise.all(
    views.map(async (view) => {
      const [viewerProfile, viewerPlan] = await Promise.all([
        repo.get<Record<string, unknown>>(`USER#${view.viewerId}`, 'PROFILE#v1'),
        subRepo.getEffectivePlan(view.viewerId),
      ]);

      return {
        ...view,
        viewerName: (viewerProfile?.name as string | undefined) || view.viewerName,
        viewerPhoto: (viewerProfile?.primaryPhotoUrl as string | undefined) || view.viewerPhoto,
        viewerCity: (viewerProfile?.city as string | undefined) || view.viewerCity,
        viewerCountry: (viewerProfile?.country as string | undefined) || view.viewerCountry,
        viewerAboutMe: viewerProfile?.aboutMe as string | undefined,
        viewerPlanId: viewerPlan,
      };
    }),
  );

  return success({ count: views.length, items: enrichedViews, tier: 'full' }, requestId);
}

export const main = createHandler(withAuth(handler));
