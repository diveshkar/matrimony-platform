import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { UploadService } from '../domain/upload-service.js';

const uploadService = new UploadService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const photoId = event.pathParameters?.photoId;
  if (!photoId) throw new ValidationError('Photo ID is required');

  await uploadService.deletePhoto(authedEvent.auth.userId, photoId);

  return success({ message: 'Photo deleted' }, requestId);
}

export const main = createHandler(withAuth(handler));
