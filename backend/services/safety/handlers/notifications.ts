import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { SafetyRepository } from '../repositories/safety-repository.js';
import { parseBody } from '../../shared/utils/parse-body.js';

const repo = new SafetyRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const method = event.requestContext?.http?.method;

  if (method === 'GET') {
    const [notifications, unreadCount] = await Promise.all([
      repo.getNotifications(authedEvent.auth.userId),
      repo.getUnreadCount(authedEvent.auth.userId),
    ]);
    return success({ items: notifications, unreadCount }, requestId);
  }

  if (method === 'PATCH') {
    const body = parseBody(event);
    if (body.markAllRead) {
      await repo.markAllNotificationsRead(authedEvent.auth.userId);
    } else if (body.sk) {
      await repo.markNotificationRead(authedEvent.auth.userId, body.sk);
    }
    return success({ status: 'updated' }, requestId);
  }

  return success({ message: 'Method not allowed' }, requestId);
}

export const main = createHandler(withAuth(handler));
