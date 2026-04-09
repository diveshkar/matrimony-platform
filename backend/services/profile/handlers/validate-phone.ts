import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler, withAuth, type AuthenticatedEvent } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { validatePhoneNumber } from '../domain/phone-validation.js';
import { ensurePhoneAvailable } from '../domain/phone-registry.js';

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;
  const authedEvent = event as AuthenticatedEvent;

  const body = event.body ? JSON.parse(event.body) : {};
  if (!body.phoneNumber) throw new ValidationError('phoneNumber is required');

  // Step 1: Check uniqueness
  await ensurePhoneAvailable(body.phoneNumber, authedEvent.auth.userId);

  // Step 2: Validate format + Twilio carrier check
  const result = await validatePhoneNumber(body.phoneNumber);

  return success({
    valid: true,
    phone: result.phone,
    country: result.country,
    carrierType: result.carrierType,
    carrier: result.carrier,
  }, requestId);
}

export const main = createHandler(withAuth(handler));
