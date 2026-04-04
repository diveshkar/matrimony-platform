import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { DiscoveryService } from '../domain/discovery-service.js';
import { searchFiltersSchema } from '../../../packages/shared-schemas/index.js';

const discoveryService = new DiscoveryService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const params = event.queryStringParameters || {};
  const parsed = searchFiltersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : {};

  const limit = Number(params.limit) || 20;
  const cursor = params.cursor;

  const result = await discoveryService.search(authedEvent.auth.userId, filters, limit, cursor);

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
