import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let client: DynamoDBDocumentClient | null = null;

export function getDynamoClient(): DynamoDBDocumentClient {
  if (client) return client;

  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const region = process.env.AWS_REGION || 'ap-south-1';
  const isLocal = !!endpoint && (endpoint.includes('localhost') || endpoint.includes('127.0.0.1'));

  const baseClient = new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
    ...(isLocal
      ? {
          credentials: {
            accessKeyId: 'fakeMyKeyId',
            secretAccessKey: 'fakeSecretAccessKey',
          },
        }
      : {}),
  });

  client = DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });

  return client;
}

export function resetClient(): void {
  client = null;
}

export function getTableName(baseName: string): string {
  const env = process.env.ENVIRONMENT || 'dev';
  return `matrimony_${baseName}_${env}`;
}
