import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId } from '../../shared/utils/id-generator.js';

export interface ConversationRecord {
  PK: string;
  SK: string;
  conversationId: string;
  participantIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface MessageRecord {
  PK: string;
  SK: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface UserConversationRecord {
  PK: string;
  SK: string;
  userId: string;
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export class ChatRepository extends BaseRepository {
  constructor() {
    super('messages');
  }

  // ── Conversations ─────────────────────────

  async createConversation(
    user1Id: string,
    user2Id: string,
    user1Name: string,
    user2Name: string,
    user1Photo?: string,
    user2Photo?: string,
  ): Promise<ConversationRecord> {
    const conversationId = generateId('CNV');
    const now = nowISO();

    const conversation: ConversationRecord = {
      PK: `CONV#${conversationId}`,
      SK: 'META#v1',
      conversationId,
      participantIds: [user1Id, user2Id],
      createdAt: now,
    };

    await this.put(conversation as unknown as Record<string, unknown>);

    await this.put({
      PK: `USERCONV#${user1Id}`,
      SK: `CONV#${now}#${conversationId}`,
      userId: user1Id,
      conversationId,
      otherUserId: user2Id,
      otherUserName: user2Name,
      otherUserPhoto: user2Photo,
      unreadCount: 0,
    });

    await this.put({
      PK: `USERCONV#${user2Id}`,
      SK: `CONV#${now}#${conversationId}`,
      userId: user2Id,
      conversationId,
      otherUserId: user1Id,
      otherUserName: user1Name,
      otherUserPhoto: user1Photo,
      unreadCount: 0,
    });

    return conversation;
  }

  async getConversation(conversationId: string): Promise<ConversationRecord | null> {
    return this.get<ConversationRecord>(`CONV#${conversationId}`, 'META#v1');
  }

  async findConversationBetween(user1Id: string, user2Id: string): Promise<string | null> {
    const result = await this.query<UserConversationRecord>(`USERCONV#${user1Id}`, {
      scanForward: false,
      limit: 50,
    });

    const found = result.items.find(
      (item) => item.SK.startsWith('CONV#') && item.otherUserId === user2Id,
    );

    return found?.conversationId || null;
  }

  async getUserConversations(userId: string, limit = 20): Promise<UserConversationRecord[]> {
    const result = await this.query<UserConversationRecord>(`USERCONV#${userId}`, {
      scanForward: false,
      limit,
    });
    return result.items.filter((i) => i.SK.startsWith('CONV#'));
  }

  // ── Messages ──────────────────────────────

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<MessageRecord> {
    const messageId = generateId('MSG');
    const now = nowISO();

    const message: MessageRecord = {
      PK: `CONV#${conversationId}`,
      SK: `MSG#${now}#${messageId}`,
      conversationId,
      messageId,
      senderId,
      content,
      status: 'sent',
      createdAt: now,
    };

    await this.put(message as unknown as Record<string, unknown>);

    await this.update(`CONV#${conversationId}`, 'META#v1', {
      lastMessage: content.slice(0, 100),
      lastMessageAt: now,
    });

    return message;
  }

  async getMessages(
    conversationId: string,
    limit = 50,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<{ items: MessageRecord[]; lastKey?: Record<string, unknown> }> {
    const result = await this.query<MessageRecord>(`CONV#${conversationId}`, {
      scanForward: false,
      limit,
      exclusiveStartKey,
    });

    const messages = result.items.filter((i) => i.SK.startsWith('MSG#'));

    return { items: messages.reverse(), lastKey: result.lastKey };
  }

  async updateUserConversationLastMessage(
    userId: string,
    conversationId: string,
    lastMessage: string,
    lastMessageAt: string,
    incrementUnread: boolean,
  ): Promise<void> {
    const convs = await this.getUserConversations(userId, 50);
    const conv = convs.find((c) => c.conversationId === conversationId);
    if (!conv) return;

    const updates: Record<string, unknown> = {
      lastMessage: lastMessage.slice(0, 100),
      lastMessageAt,
    };

    if (incrementUnread) {
      updates.unreadCount = (conv.unreadCount || 0) + 1;
    }

    await this.update(conv.PK, conv.SK, updates);
  }

  async markConversationRead(userId: string, conversationId: string): Promise<void> {
    const convs = await this.getUserConversations(userId, 50);
    const conv = convs.find((c) => c.conversationId === conversationId);
    if (!conv) return;

    await this.update(conv.PK, conv.SK, { unreadCount: 0 });
  }
}
