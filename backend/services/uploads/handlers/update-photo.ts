import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { UploadService } from '../domain/upload-service.js';

const uploadService = new UploadService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const photoId = event.pathParameters?.photoId;
  if (!photoId) throw new ValidationError('Photo ID is required');

  const body = parseBody(event);

  if (body.isPrimary === true) {
    await uploadService.setPrimary(authedEvent.auth.userId, photoId);
  }

  if (body.visibility) {
    await uploadService.updateVisibility(authedEvent.auth.userId, photoId, body.visibility);
  }

  return success({ message: 'Photo updated' }, requestId);
}

export const main = createHandler(withAuth(handler));
