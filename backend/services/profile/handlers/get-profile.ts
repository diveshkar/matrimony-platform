import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
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

  // Check profile view limit (skip for own profile)
  if (profileId !== authedEvent.auth.userId) {
    await checkEntitlement(authedEvent.auth.userId, 'profile_view');
  }

  const profile = await profileService.getPublicProfile(profileId, authedEvent.auth.userId);

  // Record profile view + notification (non-blocking, don't view yourself)
  if (profileId !== authedEvent.auth.userId) {
    try {
      const { SafetyRepository } = await import('../../safety/repositories/safety-repository.js');
      const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
      const repo = new SafetyRepository();
      const coreRepo = new BaseRepository('core');
      const viewerProfile = await coreRepo.get<Record<string, unknown>>(`USER#${authedEvent.auth.userId}`, 'PROFILE#v1');
      await repo.recordView(profileId, authedEvent.auth.userId, viewerProfile || undefined);

      // Create notification for the viewed user
      const viewerName = (viewerProfile?.name as string) || 'Someone';
      // Check if the viewed user has who-viewed-me access
      const { getRemainingUsage } = await import('../../shared/middleware/entitlement-check.js');
      const viewedUserUsage = await getRemainingUsage(profileId);

      await repo.createNotification(profileId, {
        type: 'profile_viewed',
        title: 'Someone viewed your profile',
        message: viewedUserUsage.whoViewedMeAccess
          ? `${viewerName} viewed your profile`
          : `Someone viewed your profile. Upgrade to see who!`,
        actionUrl: viewedUserUsage.whoViewedMeAccess ? '/who-viewed-me' : '/plans',
      });
    } catch { /* non-critical */ }
  }

  return success(profile, requestId);
}

export const main = createHandler(withAuth(handler));
