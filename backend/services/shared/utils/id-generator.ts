import { nanoid } from 'nanoid';

type EntityPrefix = 'USR' | 'PRF' | 'PHT' | 'INT' | 'MSG' | 'CNV' | 'SUB' | 'NTF' | 'RPT' | 'BLK' | 'STR';

export function generateId(prefix: EntityPrefix): string {
  return `${prefix}_${nanoid(16)}`;
}

export function generateMatrimonyId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MTR${num}`;
}
