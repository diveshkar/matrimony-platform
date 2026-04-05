import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { AuthService } from '../domain/auth-service.js';
import { authVerifySchema } from '../../../packages/shared-schemas/index.js';

const authService = new AuthService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  const body = event.body ? JSON.parse(event.body) : {};
  const parsed = authVerifySchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
  }

  const result = await authService.verifyOtp(parsed.data.email, parsed.data.otp);

  return success(result, requestId, 200);
}

export const main = createHandler(handler);
