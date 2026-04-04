import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { InterestService } from '../domain/interest-service.js';

const interestService = new InterestService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const type = event.queryStringParameters?.type || 'inbox';

  const result =
    type === 'outbox'
      ? await interestService.getOutbox(authedEvent.auth.userId)
      : await interestService.getInbox(authedEvent.auth.userId);

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
