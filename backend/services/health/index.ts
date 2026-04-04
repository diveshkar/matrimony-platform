import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { main as healthCheck } from './handlers/health-check.js';

export const main = async (event: APIGatewayProxyEventV2, context: Context) => {
  return healthCheck(event, context);
};
