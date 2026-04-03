import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { SafetyRepository } from '../repositories/safety-repository.js';
import { privacySettingsSchema } from '../../../packages/shared-schemas/index.js';

const repo = new SafetyRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const method = event.requestContext?.http?.method;

  if (method === 'GET') {
    const privacy = await repo.getPrivacy(authedEvent.auth.userId);
    return success(privacy || {}, requestId);
  }

  if (method === 'PATCH') {
    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = privacySettingsSchema.partial().safeParse(body);
    if (parsed.success) {
      await repo.updatePrivacy(authedEvent.auth.userId, parsed.data);
    }
    return success({ status: 'updated' }, requestId);
  }

  return success({ message: 'Method not allowed' }, requestId);
}

export const main = createHandler(withAuth(handler));
