import { InterestRepository } from '../repositories/interest-repository.js';
import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/app-errors.js';

export class InterestService {
  private repo: InterestRepository;
  private coreRepo: BaseRepository;

  constructor() {
    this.repo = new InterestRepository();
    this.coreRepo = new BaseRepository('core');
  }

  async sendInterest(senderId: string, receiverId: string, message?: string): Promise<{ status: string }> {
    if (senderId === receiverId) {
      throw new ValidationError('Cannot send interest to yourself');
    }

    // Check if blocked
    const blocked = await this.repo.isBlocked(senderId, receiverId);
    if (blocked) {
      throw new ForbiddenError('Cannot send interest to this user');
    }

    // Check duplicate
    const existing = await this.repo.getOutboxInterest(senderId, receiverId);
    if (existing) {
      throw new ConflictError('Interest already sent to this user');
    }

    // Get sender and receiver profiles for denormalized data
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

    await this.repo.updateInterestStatus(senderId, receiverId, 'accepted');
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

    const targetProfile = await this.coreRepo.get<Record<string, unknown>>(`USER#${targetUserId}`, 'PROFILE#v1');
    if (!targetProfile) {
      throw new NotFoundError('Profile');
    }

    const age = targetProfile.dateOfBirth
      ? Math.floor((Date.now() - new Date(targetProfile.dateOfBirth as string).getTime()) / 31557600000)
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
    const items = await this.repo.getShortlist(userId);
    return { items };
  }

  async isShortlisted(userId: string, targetUserId: string): Promise<boolean> {
    return this.repo.isShortlisted(userId, targetUserId);
  }
}
