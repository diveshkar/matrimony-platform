import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import {
  createHandler,
  withAuth,
  type AuthenticatedEvent,
} from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { InterestService } from '../domain/interest-service.js';

const interestService = new InterestService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const receiverId = event.pathParameters?.receiverId;
  if (!receiverId) throw new ValidationError('Receiver ID is required');

  const result = await interestService.withdrawInterest(
    authedEvent.auth.userId,
    receiverId,
  );

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
