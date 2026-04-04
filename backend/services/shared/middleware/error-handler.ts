import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { AppError } from '../errors/app-errors.js';
import { error } from '../utils/response.js';
import { logger } from '../utils/logger.js';

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

export function withErrorHandler(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    const requestId = event.requestContext?.requestId || context.awsRequestId || 'unknown';

    try {
      return await handler(event, context);
    } catch (err) {
      if (err instanceof AppError) {
        logger.warn(
          'Handled error',
          {
            code: err.code,
            message: err.message,
            statusCode: err.statusCode,
          },
          { requestId },
        );

        return error(err.code, err.message, requestId, err.statusCode);
      }

      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : undefined;

      logger.error('Unhandled error', { message, stack }, { requestId });

      return error('INTERNAL_ERROR', 'An unexpected error occurred', requestId, 500);
    }
  };
}
