import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDynamoClient, getTableName } from './dynamodb-client.js';
import { memoryStore } from './memory-store.js';
import { NotFoundError } from '../errors/app-errors.js';

const USE_MEMORY = process.env.USE_MEMORY_STORE === 'true';

export interface QueryOptions {
  indexName?: string;
  limit?: number;
  scanForward?: boolean;
  exclusiveStartKey?: Record<string, unknown>;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

export interface QueryResult<T> {
  items: T[];
  lastKey?: Record<string, unknown>;
}

export class BaseRepository {
  private _client: DynamoDBDocumentClient | null = null;
  private readonly _tableBaseName: string;

  constructor(tableBaseName: string) {
    this._tableBaseName = tableBaseName;
  }

  /** Lazy — created on first use, after env vars are set */
  protected get client(): DynamoDBDocumentClient {
    if (!this._client) this._client = getDynamoClient();
    return this._client;
  }

  protected get tableName(): string {
    return getTableName(this._tableBaseName);
  }

  async get<T>(pk: string, sk: string): Promise<T | null> {
    if (USE_MEMORY) {
      const item = memoryStore.get(this.tableName, pk, sk);
      return (item as T) || null;
    }

    const result = await this.client.send(
      new GetCommand({ TableName: this.tableName, Key: { PK: pk, SK: sk } }),
    );
    return (result.Item as T) || null;
  }

  async getOrThrow<T>(pk: string, sk: string, resourceName = 'Resource'): Promise<T> {
    const item = await this.get<T>(pk, sk);
    if (!item) throw new NotFoundError(resourceName);
    return item;
  }

  async put(item: Record<string, unknown>): Promise<void> {
    if (USE_MEMORY) {
      memoryStore.put(this.tableName, item as { PK: string; SK: string; [key: string]: unknown });
      return;
    }

    await this.client.send(new PutCommand({ TableName: this.tableName, Item: item }));
  }

  async putIfNotExists(item: Record<string, unknown>): Promise<boolean> {
    if (USE_MEMORY) {
      return memoryStore.putIfNotExists(
        this.tableName,
        item as { PK: string; SK: string; [key: string]: unknown },
      );
    }

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK)',
        }),
      );
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw err;
    }
  }

  async update(
    pk: string,
    sk: string,
    updates: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (USE_MEMORY) {
      return memoryStore.update(this.tableName, pk, sk, updates);
    }

    const updateExprParts: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, unknown> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const nameAlias = `#field${index}`;
      const valueAlias = `:val${index}`;
      updateExprParts.push(`${nameAlias} = ${valueAlias}`);
      exprNames[nameAlias] = key;
      exprValues[valueAlias] = value;
    });

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updateExprParts.join(', ')}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes || {};
  }

  async delete(pk: string, sk: string): Promise<void> {
    if (USE_MEMORY) {
      memoryStore.delete(this.tableName, pk, sk);
      return;
    }

    await this.client.send(
      new DeleteCommand({ TableName: this.tableName, Key: { PK: pk, SK: sk } }),
    );
  }

  async query<T>(pk: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    if (USE_MEMORY) {
      const result = memoryStore.query(this.tableName, pk, {
        indexName: options.indexName,
        limit: options.limit,
        scanForward: options.scanForward,
      });
      return { items: result.items as T[], lastKey: undefined };
    }

    // When querying a GSI, use the GSI's hash key name instead of PK
    const gsiKeyMap: Record<string, string> = { GSI1: 'GSI1PK', GSI2: 'GSI2PK' };
    const hashKeyName = options.indexName ? gsiKeyMap[options.indexName] || 'PK' : 'PK';

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: `${hashKeyName} = :pk`,
        ExpressionAttributeValues: {
          ':pk': pk,
          ...options.expressionAttributeValues,
        },
        ScanIndexForward: options.scanForward ?? true,
        ...(options.limit ? { Limit: options.limit } : {}),
        ...(options.indexName ? { IndexName: options.indexName } : {}),
        ...(options.exclusiveStartKey ? { ExclusiveStartKey: options.exclusiveStartKey } : {}),
        ...(options.filterExpression ? { FilterExpression: options.filterExpression } : {}),
        ...(options.expressionAttributeNames
          ? { ExpressionAttributeNames: options.expressionAttributeNames }
          : {}),
      }),
    );

    return {
      items: (result.Items || []) as T[],
      lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async queryBySortKeyPrefix<T>(
    pk: string,
    skPrefix: string,
    options: QueryOptions = {},
  ): Promise<QueryResult<T>> {
    return this.query<T>(pk, {
      ...options,
      expressionAttributeValues: {
        ...options.expressionAttributeValues,
        ':sk': skPrefix,
      },
    });
  }
}
