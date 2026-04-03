import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ProfileService } from '../domain/profile-service.js';

const profileService = new ProfileService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const result = await profileService.getMyProfile(authedEvent.auth.userId);

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
