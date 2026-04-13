import { nanoid } from 'nanoid';
import { randomInt } from 'crypto';

type EntityPrefix = 'USR' | 'PRF' | 'PHT' | 'INT' | 'MSG' | 'CNV' | 'SUB' | 'NTF' | 'RPT' | 'BLK' | 'STR';

export function generateId(prefix: EntityPrefix): string {
  return `${prefix}_${nanoid(16)}`;
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function generateMatrimonyId(): string {
  return `MTR${randomInt(100000, 999999)}`;
}
