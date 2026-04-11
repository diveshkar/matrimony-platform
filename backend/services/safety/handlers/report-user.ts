import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { SafetyRepository } from '../repositories/safety-repository.js';
import { reportSchema } from '../../../packages/shared-schemas/index.js';

const repo = new SafetyRepository();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = parseBody(event);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success)
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');

  if (parsed.data.reportedUserId === authedEvent.auth.userId) {
    throw new ValidationError('Cannot report yourself');
  }

  await repo.reportUser(
    authedEvent.auth.userId,
    parsed.data.reportedUserId,
    parsed.data.reason,
    parsed.data.description,
  );

  return success({ status: 'reported' }, requestId, 201);
}

export const main = createHandler(withAuth(handler));
