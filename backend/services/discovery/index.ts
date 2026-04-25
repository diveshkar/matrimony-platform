import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as getRecommendations } from './handlers/get-recommendations.js';
import { main as searchProfiles } from './handlers/search-profiles.js';
import { main as getRecentlyJoined } from './handlers/get-recently-joined.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'GET /discover': getRecommendations,
  'GET /discover/search': searchProfiles,
  'GET /discover/recently-joined': getRecentlyJoined,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
