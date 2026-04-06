import { InterestRepository } from '../repositories/interest-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { logger } from '../../shared/utils/logger.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/app-errors.js';

export class InterestService {
  private repo: InterestRepository;
  private coreRepo: BaseRepository;

  constructor() {
    this.repo = new InterestRepository();
    this.coreRepo = new BaseRepository('core');
  }

  async sendInterest(
    senderId: string,
    receiverId: string,
    message?: string,
  ): Promise<{ status: string }> {
    if (senderId === receiverId) {
      throw new ValidationError('Cannot send interest to yourself');
    }

    const blocked = await this.repo.isBlocked(senderId, receiverId);
    if (blocked) {
      throw new ForbiddenError('Cannot send interest to this user');
    }

    const existing = await this.repo.getOutboxInterest(senderId, receiverId);
    if (existing) {
      throw new ConflictError('Interest already sent to this user');
    }

    const cooldownKey = await this.coreRepo.get<{ ttl: number }>(
      `USER#${senderId}`,
      `INTEREST_COOLDOWN#${receiverId}`,
    );
    if (cooldownKey) {
      throw new ConflictError('Please wait before sending another interest to this user');
    }

    const [senderProfile, receiverProfile] = await Promise.all([
      this.coreRepo.get<Record<string, unknown>>(`USER#${senderId}`, 'PROFILE#v1'),
      this.coreRepo.get<Record<string, unknown>>(`USER#${receiverId}`, 'PROFILE#v1'),
    ]);

    if (!receiverProfile) {
      throw new NotFoundError('Profile');
    }

    await this.repo.sendInterest({
      senderId,
      receiverId,
      senderName: senderProfile?.name as string | undefined,
      receiverName: receiverProfile?.name as string | undefined,
      senderPhoto: senderProfile?.primaryPhotoUrl as string | undefined,
      receiverPhoto: receiverProfile?.primaryPhotoUrl as string | undefined,
      message,
    });

    try {
      const { SafetyRepository } = await import('../../safety/repositories/safety-repository.js');
      const repo = new SafetyRepository();
      const senderName = (senderProfile?.name as string) || 'Someone';
      await repo.createNotification(receiverId, {
        type: 'interest_received',
        title: 'New Interest!',
        message: `${senderName} is interested in your profile`,
        actionUrl: '/interests',
      });
    } catch (err) {
      logger.warn('Failed to send interest notification', { error: String(err) });
    }

    return { status: 'interest_sent' };
  }

  async acceptInterest(receiverId: string, senderId: string): Promise<{ status: string }> {
    const interest = await this.repo.getOutboxInterest(senderId, receiverId);
    if (!interest) {
      throw new NotFoundError('Interest');
    }
    if (interest.status !== 'pending') {
      throw new ConflictError(`Interest already ${interest.status}`);
    }

    // Check if either user has blocked the other
    const coreRepo = new BaseRepository('core');
    const [block1, block2] = await Promise.all([
      coreRepo.get(`USER#${receiverId}`, `BLOCK#${senderId}`),
      coreRepo.get(`USER#${senderId}`, `BLOCK#${receiverId}`),
    ]);
    if (block1 || block2) {
      throw new ForbiddenError('Cannot accept interest from a blocked user');
    }

    await this.repo.updateInterestStatus(senderId, receiverId, 'accepted');

    try {
      const { ChatService } = await import('../../chat/domain/chat-service.js');
      const chatService = new ChatService();
      await chatService.createConversation(senderId, receiverId);
    } catch (err) {
      logger.warn('Failed to create conversation on interest accept', { error: String(err) });
    }

    try {
      const { SafetyRepository } = await import('../../safety/repositories/safety-repository.js');
      const repo = new SafetyRepository();
      const receiverName = interest.receiverName || 'Someone';
      await repo.createNotification(senderId, {
        type: 'interest_accepted',
        title: 'Interest Accepted!',
        message: `${receiverName} accepted your interest. You can now chat!`,
        actionUrl: '/chats',
      });
    } catch (err) {
      logger.warn('Failed to send accept notification', { error: String(err) });
    }

    return { status: 'interest_accepted' };
  }

  async declineInterest(receiverId: string, senderId: string): Promise<{ status: string }> {
    const interest = await this.repo.getOutboxInterest(senderId, receiverId);
    if (!interest) {
      throw new NotFoundError('Interest');
    }
    if (interest.status !== 'pending') {
      throw new ConflictError(`Interest already ${interest.status}`);
    }

    await this.repo.updateInterestStatus(senderId, receiverId, 'declined');
    return { status: 'interest_declined' };
  }

  async withdrawInterest(senderId: string, receiverId: string): Promise<{ status: string }> {
    const interest = await this.repo.getOutboxInterest(senderId, receiverId);
    if (!interest) {
      throw new NotFoundError('Interest');
    }
    if (interest.status !== 'pending') {
      throw new ConflictError(`Cannot withdraw — interest already ${interest.status}`);
    }

    await this.repo.deleteInterest(senderId, receiverId);

    await this.coreRepo.put({
      PK: `USER#${senderId}`,
      SK: `INTEREST_COOLDOWN#${receiverId}`,
      ttl: Math.floor(Date.now() / 1000) + 86400,
      createdAt: new Date().toISOString(),
    });

    return { status: 'interest_withdrawn' };
  }

  async getInbox(userId: string): Promise<{ items: unknown[] }> {
    const items = await this.repo.getMyInbox(userId);
    return { items };
  }

  async getOutbox(userId: string): Promise<{ items: unknown[] }> {
    const items = await this.repo.getMyOutbox(userId);
    return { items };
  }

  // ── Shortlist ─────────────────────────────

  async addToShortlist(userId: string, targetUserId: string): Promise<{ status: string }> {
    if (userId === targetUserId) {
      throw new ValidationError('Cannot shortlist yourself');
    }

    const targetProfile = await this.coreRepo.get<Record<string, unknown>>(
      `USER#${targetUserId}`,
      'PROFILE#v1',
    );
    if (!targetProfile) {
      throw new NotFoundError('Profile');
    }

    const age = targetProfile.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(targetProfile.dateOfBirth as string).getTime()) / 31557600000,
        )
      : undefined;

    await this.repo.addToShortlist({
      userId,
      targetUserId,
      targetName: targetProfile.name as string | undefined,
      targetPhoto: targetProfile.primaryPhotoUrl as string | undefined,
      targetAge: age,
      targetCity: targetProfile.city as string | undefined,
      targetCountry: targetProfile.country as string | undefined,
    });

    return { status: 'shortlisted' };
  }

  async removeFromShortlist(userId: string, targetUserId: string): Promise<{ status: string }> {
    await this.repo.removeFromShortlist(userId, targetUserId);
    return { status: 'removed' };
  }

  async getShortlist(userId: string): Promise<{ items: unknown[] }> {
    const allItems = await this.repo.getShortlist(userId);

    const blockedResult = await this.coreRepo.query<{ SK: string }>(`USER#${userId}`, { limit: 200 });
    const blockedIds = new Set<string>();
    for (const item of blockedResult.items) {
      if (item.SK.startsWith('BLOCK#')) {
        blockedIds.add(item.SK.replace('BLOCK#', ''));
      }
    }

    const items = allItems.filter((item) => {
      const targetId = (item as unknown as Record<string, unknown>).targetUserId as string;
      return !blockedIds.has(targetId);
    });

    return { items };
  }

  async isShortlisted(userId: string, targetUserId: string): Promise<boolean> {
    return this.repo.isShortlisted(userId, targetUserId);
  }
}
