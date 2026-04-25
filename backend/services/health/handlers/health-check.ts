import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/index.js';
import { success } from '../../shared/utils/response.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';

const coreRepo = new BaseRepository('core');

async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const requestId = event.requestContext?.requestId || context.awsRequestId || 'local';

  // Probe DynamoDB so an external uptime monitor can detect DB outages.
  // We use a sentinel key that's guaranteed not to exist — a 0-item GetItem
  // is the cheapest possible round-trip (no full scan, no hot key).
  let dbStatus: 'ok' | 'down' = 'ok';
  let dbLatencyMs: number | null = null;
  const start = Date.now();
  try {
    await coreRepo.get('HEALTH#PROBE', 'SENTINEL');
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = 'down';
    dbLatencyMs = Date.now() - start;
  }

  const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded';

  return success(
    {
      status: overallStatus,
      service: 'matrimony-api',
      environment: process.env.ENVIRONMENT || 'dev',
      timestamp: new Date().toISOString(),
      checks: {
        dynamodb: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    },
    requestId,
  );
}

export const main = createHandler(handler);
