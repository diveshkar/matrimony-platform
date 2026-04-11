import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { InterestService } from '../domain/interest-service.js';

const interestService = new InterestService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const senderId = event.pathParameters?.senderId;
  if (!senderId) throw new ValidationError('Sender ID is required');

  const body = parseBody(event);
  const action = body.action as string;

  if (action === 'accept') {
    const result = await interestService.acceptInterest(authedEvent.auth.userId, senderId);
    return success(result, requestId);
  } else if (action === 'decline') {
    const result = await interestService.declineInterest(authedEvent.auth.userId, senderId);
    return success(result, requestId);
  } else {
    throw new ValidationError('Action must be "accept" or "decline"');
  }
}

export const main = createHandler(withAuth(handler));
