import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId } from '../../shared/utils/id-generator.js';

export interface BlockRecord {
  PK: string;
  SK: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface ReportRecord {
  PK: string;
  SK: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface ViewRecord {
  PK: string;
  SK: string;
  viewedUserId: string;
  viewerId: string;
  viewerName?: string;
  viewerPhoto?: string;
  viewerAge?: number;
  viewerCity?: string;
  viewerCountry?: string;
  createdAt: string;
}

export interface NotificationRecord {
  PK: string;
  SK: string;
  userId: string;
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export class SafetyRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  // ── Block ─────────────────────────────────

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    await this.put({
      PK: `USER#${userId}`,
      SK: `BLOCK#${blockedUserId}`,
      userId,
      blockedUserId,
      createdAt: nowISO(),
    });
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    await this.delete(`USER#${userId}`, `BLOCK#${blockedUserId}`);
  }

  async getBlockedUsers(userId: string): Promise<BlockRecord[]> {
    const result = await this.query<BlockRecord>(`USER#${userId}`, { limit: 100 });
    return result.items.filter((i) => i.SK.startsWith('BLOCK#'));
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    const b1 = await this.get(`USER#${userId}`, `BLOCK#${targetId}`);
    const b2 = await this.get(`USER#${targetId}`, `BLOCK#${userId}`);
    return !!(b1 || b2);
  }

  // ── Report ────────────────────────────────

  async reportUser(reporterId: string, reportedUserId: string, reason: string, description?: string): Promise<void> {
    const now = nowISO();
    const reportId = generateId('RPT');
    await this.put({
      PK: `USER#${reporterId}`,
      SK: `REPORT#${now}#${reportId}`,
      reporterId,
      reportedUserId,
      reason,
      description,
      status: 'pending',
      createdAt: now,
    });
  }

  // ── Profile Views ─────────────────────────

  async recordView(viewedUserId: string, viewerId: string, viewerProfile?: Record<string, unknown>): Promise<void> {
    const now = nowISO();
    const age = viewerProfile?.dateOfBirth
      ? Math.floor((Date.now() - new Date(viewerProfile.dateOfBirth as string).getTime()) / 31557600000)
      : undefined;

    await this.put({
      PK: `USER#${viewedUserId}`,
      SK: `VIEW#${now}#${viewerId}`,
      viewedUserId,
      viewerId,
      viewerName: viewerProfile?.name as string | undefined,
      viewerPhoto: viewerProfile?.primaryPhotoUrl as string | undefined,
      viewerAge: age,
      viewerCity: viewerProfile?.city as string | undefined,
      viewerCountry: viewerProfile?.country as string | undefined,
      createdAt: now,
    });
  }

  async getProfileViews(userId: string, limit = 30): Promise<ViewRecord[]> {
    const result = await this.query<ViewRecord>(`USER#${userId}`, { limit: limit + 20, scanForward: false });
    return result.items.filter((i) => i.SK.startsWith('VIEW#')).slice(0, limit);
  }

  // ── Notifications ─────────────────────────

  async createNotification(userId: string, data: {
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  }): Promise<void> {
    const now = nowISO();
    const notifId = generateId('NTF');
    await this.put({
      PK: `USER#${userId}`,
      SK: `NOTIFICATION#${now}#${notifId}`,
      userId,
      notificationId: notifId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      isRead: false,
      createdAt: now,
    });
  }

  async getNotifications(userId: string, limit = 30): Promise<NotificationRecord[]> {
    const result = await this.query<NotificationRecord>(`USER#${userId}`, { limit: limit + 50, scanForward: false });
    return result.items.filter((i) => i.SK.startsWith('NOTIFICATION#')).slice(0, limit);
  }

  async markNotificationRead(userId: string, sk: string): Promise<void> {
    await this.update(`USER#${userId}`, sk, { isRead: true });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      await this.update(`USER#${n.userId}`, n.SK, { isRead: true });
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n) => !n.isRead).length;
  }

  // ── Privacy Settings ──────────────────────

  async getPrivacy(userId: string): Promise<Record<string, unknown> | null> {
    return this.get(`USER#${userId}`, 'PRIVACY#v1');
  }

  async updatePrivacy(userId: string, updates: Record<string, unknown>): Promise<void> {
    await this.update(`USER#${userId}`, 'PRIVACY#v1', { ...updates, updatedAt: nowISO() });
  }
}
