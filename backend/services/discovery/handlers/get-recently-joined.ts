import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { DiscoveryService } from '../domain/discovery-service.js';

const discoveryService = new DiscoveryService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  // Fix 3: bound query inputs to prevent abuse / DoS
  const rawLimit = Number(event.queryStringParameters?.limit);
  const rawDays = Number(event.queryStringParameters?.days);

  const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10));
  const days = Math.min(30, Math.max(1, Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 7));

  const result = await discoveryService.getRecentlyJoined(authedEvent.auth.userId, days, limit);

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
