import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as createProfile } from './handlers/create-profile.js';
import { main as getMyProfile } from './handlers/get-my-profile.js';
import { main as updateProfile } from './handlers/update-profile.js';
import { main as getProfile } from './handlers/get-profile.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'POST /profiles': createProfile,
  'GET /me': getMyProfile,
  'PATCH /me': updateProfile,
  'GET /profiles/{id}': getProfile,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
