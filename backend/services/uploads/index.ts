import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as getUploadUrl } from './handlers/get-upload-url.js';
import { main as confirmUpload } from './handlers/confirm-upload.js';
import { main as getPhotos } from './handlers/get-photos.js';
import { main as updatePhoto } from './handlers/update-photo.js';
import { main as deletePhoto } from './handlers/delete-photo.js';

const routes: Record<string, (e: APIGatewayProxyEventV2, c: Context) => Promise<unknown>> = {
  'POST /uploads/photo-url': getUploadUrl,
  'POST /uploads/photo-confirm': confirmUpload,
  'GET /uploads/photos': getPhotos,
  'PATCH /uploads/photos/{photoId}': updatePhoto,
  'DELETE /uploads/photos/{photoId}': deletePhoto,
};

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  const handler = routes[event.routeKey];
  if (!handler) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  }
  return handler(event, context);
};
