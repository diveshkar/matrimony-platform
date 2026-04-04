import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { InterestService } from '../domain/interest-service.js';

const interestService = new InterestService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;
  const method = event.requestContext?.http?.method;

  if (method === 'GET') {
    const result = await interestService.getShortlist(authedEvent.auth.userId);
    return success(result, requestId);
  }

  if (method === 'POST') {
    const body = event.body ? JSON.parse(event.body) : {};
    if (!body.targetUserId) throw new ValidationError('targetUserId is required');
    const result = await interestService.addToShortlist(authedEvent.auth.userId, body.targetUserId);
    return success(result, requestId, 201);
  }

  if (method === 'DELETE') {
    const targetUserId = event.pathParameters?.userId;
    if (!targetUserId) throw new ValidationError('User ID is required');
    const result = await interestService.removeFromShortlist(authedEvent.auth.userId, targetUserId);
    return success(result, requestId);
  }

  return success({ message: 'Method not allowed' }, requestId);
}

export const main = createHandler(withAuth(handler));
