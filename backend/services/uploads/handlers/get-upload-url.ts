import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { UploadService } from '../domain/upload-service.js';

const uploadService = new UploadService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = event.body ? JSON.parse(event.body) : {};
  if (!body.fileName || !body.mimeType || !body.fileSize) {
    throw new ValidationError('fileName, mimeType, and fileSize are required');
  }

  const result = await uploadService.getUploadUrl(
    authedEvent.auth.userId,
    body.fileName,
    body.mimeType,
    body.fileSize,
  );

  return success(result, requestId);
}

export const main = createHandler(withAuth(handler));
