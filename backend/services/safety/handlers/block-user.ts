import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { SafetyRepository } from '../repositories/safety-repository.js';

const repo = new SafetyRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const method = event.requestContext?.http?.method;

  if (method === 'GET') {
    const blocked = await repo.getBlockedUsers(authedEvent.auth.userId);
    return success({ items: blocked }, requestId);
  }

  if (method === 'POST') {
    const body = parseBody(event);
    if (!body.blockedUserId) throw new ValidationError('blockedUserId is required');
    if (body.blockedUserId === authedEvent.auth.userId)
      throw new ValidationError('Cannot block yourself');
    await repo.blockUser(authedEvent.auth.userId, body.blockedUserId);
    return success({ status: 'blocked' }, requestId, 201);
  }

  if (method === 'DELETE') {
    const userId = event.pathParameters?.userId;
    if (!userId) throw new ValidationError('User ID is required');
    await repo.unblockUser(authedEvent.auth.userId, userId);
    return success({ status: 'unblocked' }, requestId);
  }

  return success({ message: 'Method not allowed' }, requestId);
}

export const main = createHandler(withAuth(handler));
