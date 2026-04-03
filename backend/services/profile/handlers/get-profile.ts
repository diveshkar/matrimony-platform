import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { ProfileService } from '../domain/profile-service.js';

const profileService = new ProfileService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const profileId = event.pathParameters?.id;
  if (!profileId) {
    throw new ValidationError('Profile ID is required');
  }

  const profile = await profileService.getPublicProfile(profileId, authedEvent.auth.userId);

  return success(profile, requestId);
}

export const main = createHandler(withAuth(handler));
