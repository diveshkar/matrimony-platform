import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { DiscoveryService } from '../domain/discovery-service.js';

const discoveryService = new DiscoveryService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const limit = Number(event.queryStringParameters?.limit) || 20;
  const cursor = event.queryStringParameters?.cursor;

  const result = await discoveryService.getRecommendations(
    authedEvent.auth.userId,
    limit,
    cursor,
  );

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
