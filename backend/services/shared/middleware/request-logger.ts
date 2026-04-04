import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { logger } from '../utils/logger.js';

type LambdaHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

export function withLogger(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    const requestId = event.requestContext?.requestId || context.awsRequestId || 'unknown';
    const method = event.requestContext?.http?.method || 'UNKNOWN';
    const path = event.requestContext?.http?.path || 'unknown';
    const startTime = Date.now();

    logger.info('Request started', { method, path }, { requestId });

    const result = await handler(event, context);

    const duration = Date.now() - startTime;
    const statusCode =
      typeof result === 'object' && 'statusCode' in result ? result.statusCode : 200;

    logger.info(
      'Request completed',
      { method, path, statusCode, durationMs: duration },
      { requestId },
    );

    return result;
  };
}
