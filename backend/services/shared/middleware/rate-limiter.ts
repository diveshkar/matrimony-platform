import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { RateLimitError } from '../errors/app-errors.js';
import { nowUnix, ttlFromMinutes } from '../utils/date.js';

interface RateLimitConfig {
  action: string;
  maxAttempts: number;
  windowMinutes: number;
}

export async function checkRateLimit(
  client: DynamoDBDocumentClient,
  tableName: string,
  userId: string,
  config: RateLimitConfig,
): Promise<void> {
  const pk = `RATELIMIT#${userId}`;
  const sk = `ACTION#${config.action}`;

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { PK: pk, SK: sk },
    }),
  );

  const item = result.Item;
  const now = nowUnix();

  if (item) {
    const windowStart = item.windowStart as number;
    const count = item.count as number;

    if (now - windowStart < config.windowMinutes * 60) {
      if (count >= config.maxAttempts) {
        throw new RateLimitError(
          `Too many ${config.action} attempts. Please wait ${config.windowMinutes} minutes.`,
        );
      }

      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: pk,
            SK: sk,
            windowStart,
            count: count + 1,
            ttl: ttlFromMinutes(config.windowMinutes),
            updatedAt: new Date().toISOString(),
          },
        }),
      );
      return;
    }
  }

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: pk,
        SK: sk,
        windowStart: now,
        count: 1,
        ttl: ttlFromMinutes(config.windowMinutes),
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
