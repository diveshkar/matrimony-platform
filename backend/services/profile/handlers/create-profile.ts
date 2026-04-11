import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { ProfileService } from '../domain/profile-service.js';
import { createProfileSchema } from '../../../packages/shared-schemas/index.js';

const profileService = new ProfileService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = parseBody(event);
  const parsed = createProfileSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
  }

  const profile = await profileService.createProfile(authedEvent.auth.userId, {
    ...parsed.data,
    preferences: body.preferences,
  });

  return success(profile, requestId, 201);
}

export const main = createHandler(withAuth(handler));
