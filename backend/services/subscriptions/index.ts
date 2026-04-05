import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as getPlans } from './handlers/get-plans.js';
import { main as createCheckout } from './handlers/create-checkout.js';
import { main as webhook } from './handlers/webhook.js';
import { main as getMySubscription } from './handlers/get-my-subscription.js';
import { main as verifySession } from './handlers/verify-session.js';
import { main as getUsage } from './handlers/get-usage.js';
import { main as cancelSubscription } from './handlers/cancel-subscription.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'GET /subscriptions/plans': getPlans,
  'POST /subscriptions/checkout': createCheckout,
  'POST /subscriptions/webhook': webhook,
  'GET /subscriptions/me': getMySubscription,
  'POST /subscriptions/verify-session': verifySession,
  'GET /subscriptions/usage': getUsage,
  'POST /subscriptions/cancel': cancelSubscription,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
