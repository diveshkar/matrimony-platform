import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId || 'local';

  return success(
    {
      status: 'ok',
      service: 'matrimony-api',
      environment: process.env.ENVIRONMENT || 'dev',
      timestamp: new Date().toISOString(),
    },
    requestId,
  );
}

export const main = createHandler(handler);
