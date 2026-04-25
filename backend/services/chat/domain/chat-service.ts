import { ChatRepository } from '../repositories/chat-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';
import { withRetry } from '../../shared/utils/retry.js';

export class ChatService {
  private chatRepo: ChatRepository;
  private coreRepo: BaseRepository;

  constructor() {
    this.chatRepo = new ChatRepository();
    this.coreRepo = new BaseRepository('core');
  }

  private async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const [block1, block2] = await Promise.all([
      this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId1}`, 'BLOCK'),
      this.coreRepo.get<{ blockedUserIds?: string[] }>(`USER#${userId2}`, 'BLOCK'),
    ]);
    return (block1?.blockedUserIds || []).includes(userId2) || (block2?.blockedUserIds || []).includes(userId1);
  }

  async createConversation(user1Id: string, user2Id: string): Promise<{ conversationId: string }> {
    if (user1Id === user2Id) {
      throw new ValidationError('Cannot create conversation with yourself');
    }

    const blocked = await this.isBlocked(user1Id, user2Id);
    if (blocked) {
      throw new ForbiddenError('Cannot message this user');
    }

    const existing = await this.chatRepo.findConversationBetween(user1Id, user2Id);
    if (existing) {
      return { conversationId: existing };
    }

    const [profile1, profile2] = await Promise.all([
      this.coreRepo.get<Record<string, unknown>>(`USER#${user1Id}`, 'PROFILE#v1'),
      this.coreRepo.get<Record<string, unknown>>(`USER#${user2Id}`, 'PROFILE#v1'),
    ]);

    const conv = await this.chatRepo.createConversation(
      user1Id,
      user2Id,
      (profile1?.name as string) || 'Unknown',
      (profile2?.name as string) || 'Unknown',
      profile1?.primaryPhotoUrl as string | undefined,
      profile2?.primaryPhotoUrl as string | undefined,
    );

    return { conversationId: conv.conversationId };
  }

  async getMyConversations(userId: string): Promise<{ items: unknown[] }> {
    const items = await this.chatRepo.getUserConversations(userId);
    return { items };
  }

  async getMessages(
    userId: string,
    conversationId: string,
    limit = 50,
    cursor?: string,
  ): Promise<{ items: unknown[]; nextCursor?: string }> {
    const conv = await this.chatRepo.getConversation(conversationId);
    if (!conv) throw new NotFoundError('Conversation');
    if (!conv.participantIds.includes(userId)) {
      throw new ForbiddenError('Not a participant in this conversation');
    }

    let startKey: Record<string, unknown> | undefined;
    try {
      startKey = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;
    } catch {
      startKey = undefined;
    }
    const result = await this.chatRepo.getMessages(conversationId, limit, startKey);

    await this.chatRepo.markConversationRead(userId, conversationId);

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return { items: result.items, nextCursor };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
  ): Promise<{ message: unknown }> {
    if (!content.trim()) throw new ValidationError('Message cannot be empty');
    if (content.length > 2000) throw new ValidationError('Message too long (max 2000 characters)');

    const conv = await this.chatRepo.getConversation(conversationId);
    if (!conv) throw new NotFoundError('Conversation');
    if (!conv.participantIds.includes(userId)) {
      throw new ForbiddenError('Not a participant in this conversation');
    }

    const otherUser = conv.participantIds.find((id) => id !== userId)!;
    const blocked = await this.isBlocked(userId, otherUser);
    if (blocked) {
      throw new ForbiddenError('Cannot message this user');
    }

    const message = await this.chatRepo.sendMessage(conversationId, userId, content.trim());

    await Promise.all([
      this.chatRepo.updateUserConversationLastMessage(
        userId,
        conversationId,
        content.trim(),
        message.createdAt,
        false,
      ),
      this.chatRepo.updateUserConversationLastMessage(
        otherUser,
        conversationId,
        content.trim(),
        message.createdAt,
        true,
      ),
    ]);

    try {
      const senderProfile = await this.coreRepo.get<{ name?: string }>(`USER#${userId}`, 'PROFILE#v1');
      const senderName = (senderProfile?.name as string) || 'Someone';
      const preview = content.trim().length > 50 ? content.trim().slice(0, 50) + '...' : content.trim();

      const { SafetyRepository } = await import('../../safety/repositories/safety-repository.js');
      const repo = new SafetyRepository();
      await withRetry(
        () =>
          repo.createNotification(otherUser, {
            type: 'new_message',
            title: `New message from ${senderName}`,
            message: preview,
            actionUrl: `/chats/${conversationId}`,
          }),
        { attempts: 3, label: 'chat-notification' },
      );
    } catch (err) {
      // Bumped to error so CloudWatch alarms can fire on persistent failures.
      // The message itself was already saved — only the push notification is lost.
      logger.error('Failed to create chat notification after retries', {
        error: String(err),
        conversationId,
        receiverId: otherUser,
      });
    }

    return { message };
  }
}
