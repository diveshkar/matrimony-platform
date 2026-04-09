import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as blockUser } from './handlers/block-user.js';
import { main as reportUser } from './handlers/report-user.js';
import { main as whoViewedMe } from './handlers/who-viewed-me.js';
import { main as notifications } from './handlers/notifications.js';
import { main as privacySettings } from './handlers/privacy-settings.js';
import { main as successStories } from './handlers/success-stories.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'GET /blocks': blockUser,
  'POST /blocks': blockUser,
  'DELETE /blocks/{userId}': blockUser,
  'POST /reports': reportUser,
  'GET /who-viewed-me': whoViewedMe,
  'GET /notifications': notifications,
  'PATCH /notifications': notifications,
  'GET /settings/privacy': privacySettings,
  'PATCH /settings/privacy': privacySettings,
  'GET /success-stories': successStories,
  'GET /my-story': successStories,
  'GET /my-story/matches': successStories,
  'POST /my-story': successStories,
  'POST /my-story/approve': successStories,
  'DELETE /my-story': successStories,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
