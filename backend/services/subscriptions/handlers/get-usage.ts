import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { getRemainingUsage } from '../../shared/middleware/entitlement-check.js';

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const usage = await getRemainingUsage(authedEvent.auth.userId);

  return success(usage, requestId);
}

export const main = createHandler(withAuth(handler));
