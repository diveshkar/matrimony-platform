import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { withErrorHandler } from './error-handler.js';
import { withLogger } from './request-logger.js';
import { cors } from '../utils/response.js';

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

/**
 * Composes standard middleware around a Lambda handler.
 * Applied in order: logger -> errorHandler -> handler
 */
export function createHandler(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    // Handle CORS preflight
    if (event.requestContext?.http?.method === 'OPTIONS') {
      return cors();
    }

    return withLogger(withErrorHandler(handler))(event, context);
  };
}

export { withAuth, type AuthenticatedEvent } from './auth-middleware.js';
export { withErrorHandler } from './error-handler.js';
export { withLogger } from './request-logger.js';
export { checkRateLimit } from './rate-limiter.js';
