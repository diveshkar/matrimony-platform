import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as authStart } from './handlers/auth-start.js';
import { main as authVerify } from './handlers/auth-verify.js';
import { main as authRefresh } from './handlers/auth-refresh.js';
import { main as authLogout } from './handlers/auth-logout.js';
import { main as authMe } from './handlers/auth-me.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'POST /auth/start': authStart,
  'POST /auth/verify': authVerify,
  'POST /auth/refresh': authRefresh,
  'POST /auth/logout': authLogout,
  'GET /auth/me': authMe,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
