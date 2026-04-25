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

const isDev = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
const USE_MEMORY = isDev && process.env.USE_MEMORY_STORE === 'true';

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

  async incrementIfBelow(
    pk: string,
    sk: string,
    field: string,
    limit: number,
    defaults?: Record<string, unknown>,
  ): Promise<{ success: boolean; newValue: number }> {
    if (USE_MEMORY) {
      const item = memoryStore.get(this.tableName, pk, sk) || { PK: pk, SK: sk, [field]: 0, ...defaults };
      const current = (item[field] as number) || 0;
      if (current >= limit) return { success: false, newValue: current };
      item[field] = current + 1;
      memoryStore.put(this.tableName, item as { PK: string; SK: string; [key: string]: unknown });
      return { success: true, newValue: current + 1 };
    }

    try {
      const exprNames: Record<string, string> = { '#cnt': field };
      const exprValues: Record<string, unknown> = { ':one': 1, ':limit': limit, ':zero': 0 };

      let setDefaults = '';
      if (defaults) {
        const entries = Object.entries(defaults);
        entries.forEach(([key, value], i) => {
          exprNames[`#def${i}`] = key;
          exprValues[`:def${i}`] = value;
        });
        setDefaults = entries.map((_, i) => `#def${i} = if_not_exists(#def${i}, :def${i})`).join(', ') + ', ';
      }

      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          UpdateExpression: `SET ${setDefaults}#cnt = if_not_exists(#cnt, :zero) + :one`,
          ConditionExpression: 'attribute_not_exists(#cnt) OR #cnt < :limit',
          ExpressionAttributeNames: exprNames,
          ExpressionAttributeValues: exprValues,
          ReturnValues: 'ALL_NEW',
        }),
      );

      return { success: true, newValue: (result.Attributes?.[field] as number) || 1 };
    } catch (err) {
      if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
        return { success: false, newValue: limit };
      }
      throw err;
    }
  }

  async conditionalUpdate(
    pk: string,
    sk: string,
    updates: Record<string, unknown>,
    conditionField: string,
    conditionValue: unknown,
  ): Promise<boolean> {
    if (USE_MEMORY) {
      const item = memoryStore.get(this.tableName, pk, sk);
      if (!item || item[conditionField] !== conditionValue) return false;
      memoryStore.update(this.tableName, pk, sk, updates);
      return true;
    }

    try {
      const updateExprParts: string[] = [];
      const exprNames: Record<string, string> = { '#cond': conditionField };
      const exprValues: Record<string, unknown> = { ':condVal': conditionValue };

      Object.entries(updates).forEach(([key, value], index) => {
        exprNames[`#f${index}`] = key;
        exprValues[`:v${index}`] = value;
        updateExprParts.push(`#f${index} = :v${index}`);
      });

      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          UpdateExpression: `SET ${updateExprParts.join(', ')}`,
          ConditionExpression: '#cond = :condVal',
          ExpressionAttributeNames: exprNames,
          ExpressionAttributeValues: exprValues,
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

  async delete(pk: string, sk: string): Promise<void> {
    if (USE_MEMORY) {
      memoryStore.delete(this.tableName, pk, sk);
      return;
    }

    await this.client.send(
      new DeleteCommand({ TableName: this.tableName, Key: { PK: pk, SK: sk } }),
    );
  }

  /**
   * Delete only if `conditionField` still equals `conditionValue`.
   * Returns true if the delete actually happened, false if the row was
   * missing or the field had a different value (e.g. consumed by a parallel call).
   */
  async conditionalDelete(
    pk: string,
    sk: string,
    conditionField: string,
    conditionValue: unknown,
  ): Promise<boolean> {
    if (USE_MEMORY) {
      const item = memoryStore.get(this.tableName, pk, sk);
      if (!item || item[conditionField] !== conditionValue) return false;
      memoryStore.delete(this.tableName, pk, sk);
      return true;
    }

    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          ConditionExpression: '#cond = :condVal',
          ExpressionAttributeNames: { '#cond': conditionField },
          ExpressionAttributeValues: { ':condVal': conditionValue },
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

  async query<T>(pk: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    if (USE_MEMORY) {
      const result = memoryStore.query(this.tableName, pk, {
        indexName: options.indexName,
        limit: options.limit,
        scanForward: options.scanForward,
      });
      return { items: result.items as T[], lastKey: undefined };
    }

    const gsiKeyMap: Record<string, string> = { GSI1: 'GSI1PK', GSI2: 'GSI2PK', GSI3: 'GSI3PK' };
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
