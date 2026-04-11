import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as healthCheck } from './handlers/health-check.js';
import { main as platformStats } from './handlers/platform-stats.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'GET /health': healthCheck,
  'GET /stats': platformStats,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) return healthCheck(event, context);
  return handler(event, context);
};
