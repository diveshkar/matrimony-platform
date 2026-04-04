import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { UploadService } from '../domain/upload-service.js';

const uploadService = new UploadService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const photos = await uploadService.getMyPhotos(authedEvent.auth.userId);

  return success(photos, requestId);
}

export const main = createHandler(withAuth(handler));
