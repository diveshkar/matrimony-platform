import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { InterestService } from '../domain/interest-service.js';
import { sendInterestSchema } from '../../../packages/shared-schemas/index.js';
import { checkEntitlement } from '../../shared/middleware/entitlement-check.js';

const interestService = new InterestService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  await checkEntitlement(authedEvent.auth.userId, 'send_interest');

  const body = parseBody(event);
  const parsed = sendInterestSchema.safeParse(body);
  if (!parsed.success)
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');

  const result = await interestService.sendInterest(
    authedEvent.auth.userId,
    parsed.data.receiverId,
    parsed.data.message,
  );

  return success(result, requestId, 201);
}

export const main = createHandler(withAuth(handler));
