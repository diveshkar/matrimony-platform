import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { ValidationError, RateLimitError } from '../../shared/errors/app-errors.js';
import { parseBody } from '../../shared/utils/parse-body.js';
import { AuthService } from '../domain/auth-service.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';

const authService = new AuthService();
const coreRepo = new BaseRepository('core');

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId;

  const body = parseBody(event);
  if (!body.refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const ip = event.requestContext?.http?.sourceIp || 'unknown';
  const rateLimitResult = await coreRepo.incrementIfBelow(
    `RATELIMIT#refresh#${ip}`,
    'WINDOW',
    'count',
    10,
    { ttl: Math.floor(Date.now() / 1000) + 60 },
  );

  if (!rateLimitResult.success) {
    throw new RateLimitError('Too many refresh attempts. Please wait a minute.');
  }

  const result = await authService.refreshTokens(body.refreshToken);

  return success(result, requestId, 200);
}

export const main = createHandler(handler);
