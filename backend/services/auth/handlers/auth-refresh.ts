import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { AuthService } from '../domain/auth-service.js';

const authService = new AuthService();

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  const body = event.body ? JSON.parse(event.body) : {};
  if (!body.refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const result = await authService.refreshTokens(body.refreshToken);

  return success(result, requestId, 200);
}

export const main = createHandler(handler);
