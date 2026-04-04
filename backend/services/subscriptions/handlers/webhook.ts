import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { success, error } from '../../shared/utils/response.js';
import { logger } from '../../shared/utils/logger.js';
import { SubscriptionService } from '../domain/subscription-service.js';

const subscriptionService = new SubscriptionService();

export async function main(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  try {
    const payload = event.body || '';
    const signature = event.headers['stripe-signature'] || '';

    await subscriptionService.handleWebhook(payload, signature);

    return success({ received: true }, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    logger.error('Webhook processing failed', { message });
    return error('WEBHOOK_ERROR', message, requestId, 400);
  }
}
