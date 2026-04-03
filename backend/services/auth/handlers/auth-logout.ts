import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { AuthService } from '../domain/auth-service.js';

const authService = new AuthService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  await authService.logout(authedEvent.auth.userId);

  return success({ message: 'Logged out successfully' }, requestId, 200);
}

export const main = createHandler(withAuth(handler));
