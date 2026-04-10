import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';
import { ProfileService } from '../domain/profile-service.js';
import { checkEntitlement } from '../../shared/middleware/entitlement-check.js';

const profileService = new ProfileService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const profileId = event.pathParameters?.id;
  if (!profileId) {
    throw new ValidationError('Profile ID is required');
  }

  if (profileId !== authedEvent.auth.userId) {
    await checkEntitlement(authedEvent.auth.userId, 'profile_view');
  }

  const profile = await profileService.getPublicProfile(profileId, authedEvent.auth.userId);

  if (profileId !== authedEvent.auth.userId) {
    try {
      const { SafetyRepository } = await import('../../safety/repositories/safety-repository.js');
      const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
      const repo = new SafetyRepository();
      const coreRepo = new BaseRepository('core');

      const today = new Date().toISOString().split('T')[0];
      const dedupKey = `VIEWDEDUP#${authedEvent.auth.userId}#${today}`;
      const alreadyViewed = await coreRepo.get(`USER#${profileId}`, dedupKey);

      if (!alreadyViewed) {
        await coreRepo.put({
          PK: `USER#${profileId}`,
          SK: dedupKey,
          viewerId: authedEvent.auth.userId,
          date: today,
          ttl: Math.floor(Date.now() / 1000) + 86400 * 2,
        });

        // Fetch viewer profile + discovery context in parallel
        const { getDiscoveryContext } = await import('../../discovery/domain/discovery-context.js');
        const [viewerProfile, discoveryCtx] = await Promise.all([
          coreRepo.get<Record<string, unknown>>(
            `USER#${authedEvent.auth.userId}`,
            'PROFILE#v1',
          ),
          getDiscoveryContext(coreRepo, authedEvent.auth.userId, profileId),
        ]);

        await repo.recordView(profileId, authedEvent.auth.userId, viewerProfile || undefined, discoveryCtx || undefined);

        const viewerName = (viewerProfile?.name as string) || 'Someone';
        const { SubscriptionRepository } = await import('../../subscriptions/repositories/subscription-repository.js');
        const viewedSubRepo = new SubscriptionRepository();
        const viewedSub = await viewedSubRepo.getSubscription(profileId);
        const viewedPlan = viewedSub?.status === 'active' ? viewedSub.planId : 'free';

        const canSeeNames = viewedPlan === 'gold' || viewedPlan === 'platinum';
        const canSeeCount = viewedPlan === 'silver' || canSeeNames;

        await repo.createNotification(profileId, {
          type: 'profile_viewed',
          title: 'Someone viewed your profile',
          message: canSeeNames
            ? `${viewerName} viewed your profile`
            : canSeeCount
              ? 'Someone viewed your profile. Upgrade to Gold to see who!'
              : 'Someone viewed your profile. Upgrade to see who!',
          actionUrl: canSeeCount ? '/who-viewed-me' : '/plans',
        });
      }
    } catch (err) {
      logger.warn('Failed to record profile view', { error: String(err) });
    }

    // Mark profile as "viewed" for tiered discovery cooldown (3-day cooldown)
    try {
      const { recordSeenAction } = await import('../../discovery/domain/seen-tracking.js');
      const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
      const seenRepo = new BaseRepository('core');
      await recordSeenAction(seenRepo, authedEvent.auth.userId, profileId, 'viewed');
    } catch (err) {
      logger.warn('Failed to record seen profile', { error: String(err) });
    }

  }

  return success(profile, requestId);
}

export const main = createHandler(withAuth(handler));
