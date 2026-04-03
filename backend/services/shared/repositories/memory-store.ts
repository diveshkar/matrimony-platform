/**
 * In-memory DynamoDB-like store for local development.
 * No Docker or DynamoDB Local required.
 * Data resets when the dev server restarts.
 */

interface Item {
  PK: string;
  SK: string;
  [key: string]: unknown;
}

class MemoryStore {
  private tables = new Map<string, Item[]>();

  private getTable(tableName: string): Item[] {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    return this.tables.get(tableName)!;
  }

  put(tableName: string, item: Item): void {
    const table = this.getTable(tableName);
    const idx = table.findIndex((i) => i.PK === item.PK && i.SK === item.SK);
    if (idx >= 0) {
      table[idx] = item;
    } else {
      table.push({ ...item });
    }
  }

  get(tableName: string, pk: string, sk: string): Item | undefined {
    return this.getTable(tableName).find((i) => i.PK === pk && i.SK === sk);
  }

  query(
    tableName: string,
    pk: string,
    options?: { indexName?: string; limit?: number; scanForward?: boolean },
  ): { items: Item[]; lastKey?: undefined } {
    const table = this.getTable(tableName);
    let results: Item[];

    if (options?.indexName === 'GSI1') {
      results = table.filter((i) => i.GSI1PK === pk);
    } else {
      results = table.filter((i) => i.PK === pk);
    }

    if (options?.scanForward === false) {
      results.reverse();
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return { items: results };
  }

  update(tableName: string, pk: string, sk: string, updates: Record<string, unknown>): Item {
    const table = this.getTable(tableName);
    const idx = table.findIndex((i) => i.PK === pk && i.SK === sk);
    if (idx < 0) {
      const newItem = { PK: pk, SK: sk, ...updates };
      table.push(newItem);
      return newItem;
    }
    Object.assign(table[idx], updates);
    return table[idx];
  }

  delete(tableName: string, pk: string, sk: string): void {
    const table = this.getTable(tableName);
    const idx = table.findIndex((i) => i.PK === pk && i.SK === sk);
    if (idx >= 0) {
      table.splice(idx, 1);
    }
  }

  putIfNotExists(tableName: string, item: Item): boolean {
    const existing = this.get(tableName, item.PK, item.SK);
    if (existing) return false;
    this.put(tableName, item);
    return true;
  }
}

export const memoryStore = new MemoryStore();
