import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as sendInterest } from './handlers/send-interest.js';
import { main as respondInterest } from './handlers/respond-interest.js';
import { main as getInterests } from './handlers/get-interests.js';
import { main as shortlist } from './handlers/shortlist.js';
import { main as withdrawInterest } from './handlers/withdraw-interest.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'POST /interests': sendInterest,
  'POST /interests/{senderId}/respond': respondInterest,
  'DELETE /interests/{receiverId}': withdrawInterest,
  'GET /interests': getInterests,
  'GET /shortlist': shortlist,
  'POST /shortlist': shortlist,
  'DELETE /shortlist/{userId}': shortlist,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
