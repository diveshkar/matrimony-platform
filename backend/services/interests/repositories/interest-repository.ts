import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';

export interface InterestRecord {
  PK: string;
  SK: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  senderPhoto?: string;
  receiverPhoto?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistRecord {
  PK: string;
  SK: string;
  userId: string;
  targetUserId: string;
  targetName?: string;
  targetPhoto?: string;
  targetAge?: number;
  targetCity?: string;
  targetCountry?: string;
  createdAt: string;
}

export class InterestRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  // ── Interests ─────────────────────────────

  async getOutboxInterest(senderId: string, receiverId: string): Promise<InterestRecord | null> {
    return this.get<InterestRecord>(`USER#${senderId}`, `INTEREST#OUT#${receiverId}`);
  }

  async sendInterest(data: {
    senderId: string;
    receiverId: string;
    senderName?: string;
    receiverName?: string;
    senderPhoto?: string;
    receiverPhoto?: string;
    message?: string;
  }): Promise<InterestRecord> {
    const now = nowISO();
    const interest: InterestRecord = {
      PK: `USER#${data.senderId}`,
      SK: `INTEREST#OUT#${data.receiverId}`,
      senderId: data.senderId,
      receiverId: data.receiverId,
      senderName: data.senderName,
      receiverName: data.receiverName,
      senderPhoto: data.senderPhoto,
      receiverPhoto: data.receiverPhoto,
      message: data.message,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Dual write — outbox for sender
    await this.put(interest as unknown as Record<string, unknown>);

    // Inbox for receiver
    await this.put({
      ...interest,
      PK: `USER#${data.receiverId}`,
      SK: `INTEREST#IN#${data.senderId}`,
    } as unknown as Record<string, unknown>);

    return interest;
  }

  async updateInterestStatus(
    senderId: string,
    receiverId: string,
    status: 'accepted' | 'declined',
  ): Promise<void> {
    const now = nowISO();

    // Update outbox (sender's view)
    await this.update(`USER#${senderId}`, `INTEREST#OUT#${receiverId}`, {
      status,
      updatedAt: now,
    });

    // Update inbox (receiver's view)
    await this.update(`USER#${receiverId}`, `INTEREST#IN#${senderId}`, {
      status,
      updatedAt: now,
    });
  }

  async deleteInterest(senderId: string, receiverId: string): Promise<void> {
    await this.delete(`USER#${senderId}`, `INTEREST#OUT#${receiverId}`);
    await this.delete(`USER#${receiverId}`, `INTEREST#IN#${senderId}`);
  }

  async getMyInbox(userId: string, limit = 20): Promise<InterestRecord[]> {
    const result = await this.query<InterestRecord>(`USER#${userId}`, {
      limit,
      scanForward: false,
    });
    return result.items.filter((i) => i.SK.startsWith('INTEREST#IN#'));
  }

  async getMyOutbox(userId: string, limit = 20): Promise<InterestRecord[]> {
    const result = await this.query<InterestRecord>(`USER#${userId}`, {
      limit,
      scanForward: false,
    });
    return result.items.filter((i) => i.SK.startsWith('INTEREST#OUT#'));
  }

  // ── Shortlist ─────────────────────────────

  async addToShortlist(data: {
    userId: string;
    targetUserId: string;
    targetName?: string;
    targetPhoto?: string;
    targetAge?: number;
    targetCity?: string;
    targetCountry?: string;
  }): Promise<ShortlistRecord> {
    const record: ShortlistRecord = {
      PK: `USER#${data.userId}`,
      SK: `SHORTLIST#${data.targetUserId}`,
      userId: data.userId,
      targetUserId: data.targetUserId,
      targetName: data.targetName,
      targetPhoto: data.targetPhoto,
      targetAge: data.targetAge,
      targetCity: data.targetCity,
      targetCountry: data.targetCountry,
      createdAt: nowISO(),
    };
    await this.put(record as unknown as Record<string, unknown>);
    return record;
  }

  async removeFromShortlist(userId: string, targetUserId: string): Promise<void> {
    await this.delete(`USER#${userId}`, `SHORTLIST#${targetUserId}`);
  }

  async getShortlist(userId: string, limit = 50): Promise<ShortlistRecord[]> {
    const result = await this.query<ShortlistRecord>(`USER#${userId}`, { limit });
    return result.items.filter((i) => i.SK.startsWith('SHORTLIST#'));
  }

  async isShortlisted(userId: string, targetUserId: string): Promise<boolean> {
    const item = await this.get(`USER#${userId}`, `SHORTLIST#${targetUserId}`);
    return !!item;
  }

  // ── Block check ───────────────────────────

  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const block1 = await this.get(`USER#${userId}`, `BLOCK#${targetUserId}`);
    const block2 = await this.get(`USER#${targetUserId}`, `BLOCK#${userId}`);
    return !!(block1 || block2);
  }
}
