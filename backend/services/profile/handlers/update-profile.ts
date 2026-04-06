import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { ProfileService } from '../domain/profile-service.js';
import { updateProfileSchema, preferencesSchema } from '../../../packages/shared-schemas/index.js';

const profileService = new ProfileService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = event.body ? JSON.parse(event.body) : {};
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
  }

  let validatedPreferences = undefined;
  if (body.preferences) {
    const prefsParsed = preferencesSchema.safeParse(body.preferences);
    if (!prefsParsed.success) {
      throw new ValidationError(prefsParsed.error.errors[0]?.message || 'Invalid preferences');
    }
    validatedPreferences = prefsParsed.data;
  }

  const result = await profileService.updateProfile(authedEvent.auth.userId, {
    ...parsed.data,
    preferences: validatedPreferences,
  });

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
