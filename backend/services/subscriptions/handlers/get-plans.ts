import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { SubscriptionService } from '../domain/subscription-service.js';

const subscriptionService = new SubscriptionService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  const plans = await subscriptionService.getPlans();

  return success(plans, requestId);
}

export const main = createHandler(handler);
