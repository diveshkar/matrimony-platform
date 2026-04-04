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
  if (!body.s3Key || !body.url || !body.fileSize || !body.mimeType) {
    throw new ValidationError('s3Key, url, fileSize, and mimeType are required');
  }

  const photo = await uploadService.confirmUpload(authedEvent.auth.userId, {
    s3Key: body.s3Key,
    url: body.url,
    fileSize: body.fileSize,
    mimeType: body.mimeType,
    visibility: body.visibility,
  });

  return success(photo, requestId, 201);
}

export const main = createHandler(withAuth(handler));
