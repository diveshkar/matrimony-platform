import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId, generateMatrimonyId } from '../../shared/utils/id-generator.js';

export interface OtpRecord {
  PK: string;
  SK: string;
  otp: string;
  identifier: string; // phone or email
  type: 'phone' | 'email';
  attempts: number;
  expiresAt: number;
  createdAt: string;
  ttl: number;
}

export interface AccountRecord {
  PK: string;
  SK: string;
  userId: string;
  phone?: string;
  email?: string;
  matrimonyId: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  hasProfile: boolean;
  onboardingComplete: boolean;
  refreshToken?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export class AuthRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  async storeOtp(identifier: string, type: 'phone' | 'email', otp: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.put({
      PK: `OTP#${identifier}`,
      SK: 'PENDING#v1',
      otp,
      identifier,
      type,
      attempts: 0,
      expiresAt: now + 300,
      createdAt: nowISO(),
      ttl: now + 600,
    });
  }

  async getOtp(identifier: string): Promise<OtpRecord | null> {
    return this.get<OtpRecord>(`OTP#${identifier}`, 'PENDING#v1');
  }

  async incrementOtpAttempts(identifier: string): Promise<void> {
    await this.update(`OTP#${identifier}`, 'PENDING#v1', {
      attempts: (await this.getOtp(identifier))?.attempts ?? 0 + 1,
    });
  }

  async deleteOtp(identifier: string): Promise<void> {
    await this.delete(`OTP#${identifier}`, 'PENDING#v1');
  }

  async getLockout(identifier: string): Promise<{ lockedUntil: number } | null> {
    const record = await this.get<{ lockedUntil: number }>(`OTP#${identifier}`, 'LOCKOUT#v1');
    if (!record) return null;
    if (record.lockedUntil <= Math.floor(Date.now() / 1000)) return null;
    return record;
  }

  async setLockout(identifier: string, durationSeconds: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.put({
      PK: `OTP#${identifier}`,
      SK: 'LOCKOUT#v1',
      lockedUntil: now + durationSeconds,
      ttl: now + durationSeconds,
      createdAt: new Date().toISOString(),
    });
  }

  async findAccountByPhone(phone: string): Promise<AccountRecord | null> {
    const result = await this.query<{ userId: string }>(`PHONE#${phone}`, {
      indexName: 'GSI1',
      limit: 1,
    });
    const indexItem = result.items[0];
    if (!indexItem?.userId) return null;
    return this.getAccount(indexItem.userId);
  }

  async findAccountByEmail(email: string): Promise<AccountRecord | null> {
    const result = await this.query<{ userId: string }>(`EMAIL#${email}`, {
      indexName: 'GSI1',
      limit: 1,
    });
    const indexItem = result.items[0];
    if (!indexItem?.userId) return null;
    return this.getAccount(indexItem.userId);
  }

  async getAccount(userId: string): Promise<AccountRecord | null> {
    return this.get<AccountRecord>(`USER#${userId}`, 'ACCOUNT#v1');
  }

  async createAccount(phone?: string, email?: string): Promise<AccountRecord> {
    const userId = generateId('USR');
    const matrimonyId = generateMatrimonyId();
    const now = nowISO();

    const account: AccountRecord = {
      PK: `USER#${userId}`,
      SK: 'ACCOUNT#v1',
      userId,
      phone,
      email,
      matrimonyId,
      accountStatus: 'active',
      hasProfile: false,
      onboardingComplete: false,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.put(account as unknown as Record<string, unknown>);

    if (phone) {
      await this.put({
        PK: `USER#${userId}`,
        SK: `PHONE#${phone}`,
        GSI1PK: `PHONE#${phone}`,
        GSI1SK: `USER#${userId}`,
        userId,
      });
    }

    if (email) {
      await this.put({
        PK: `USER#${userId}`,
        SK: `EMAIL#${email}`,
        GSI1PK: `EMAIL#${email}`,
        GSI1SK: `USER#${userId}`,
        userId,
      });
    }

    return account;
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.update(`USER#${userId}`, 'ACCOUNT#v1', {
      refreshToken,
      updatedAt: nowISO(),
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.update(`USER#${userId}`, 'ACCOUNT#v1', {
      refreshToken: '',
      updatedAt: nowISO(),
    });
  }
}
