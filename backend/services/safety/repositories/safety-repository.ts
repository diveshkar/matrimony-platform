import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId } from '../../shared/utils/id-generator.js';

export interface BlockRecord {
  PK: string;
  SK: string;
  userId: string;
  blockedUserIds: string[];
  updatedAt: string;
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

  async getBlockRecord(userId: string): Promise<BlockRecord | null> {
    return this.get<BlockRecord>(`USER#${userId}`, 'BLOCK');
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const record = await this.getBlockRecord(userId);
    return record?.blockedUserIds || [];
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    const record = await this.getBlockRecord(userId);
    const existing = record?.blockedUserIds || [];

    if (existing.includes(blockedUserId)) return;

    await this.put({
      PK: `USER#${userId}`,
      SK: 'BLOCK',
      userId,
      blockedUserIds: [...existing, blockedUserId],
      updatedAt: nowISO(),
    });
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const record = await this.getBlockRecord(userId);
    if (!record) return;

    const updated = record.blockedUserIds.filter((id) => id !== blockedUserId);

    if (updated.length === 0) {
      await this.delete(`USER#${userId}`, 'BLOCK');
    } else {
      await this.put({
        PK: `USER#${userId}`,
        SK: 'BLOCK',
        userId,
        blockedUserIds: updated,
        updatedAt: nowISO(),
      });
    }
  }

  async getBlockedUsers(userId: string): Promise<{ blockedUserId: string }[]> {
    const ids = await this.getBlockedUserIds(userId);
    return ids.map((id) => ({ blockedUserId: id }));
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    const [myBlocks, theirBlocks] = await Promise.all([
      this.getBlockedUserIds(userId),
      this.getBlockedUserIds(targetId),
    ]);
    return myBlocks.includes(targetId) || theirBlocks.includes(userId);
  }

  // ── Report ────────────────────────────────

  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    description?: string,
  ): Promise<void> {
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

  async recordView(
    viewedUserId: string,
    viewerId: string,
    viewerProfile?: Record<string, unknown>,
    discoveryCtx?: { matchScore: number; rank: number },
  ): Promise<void> {
    const now = nowISO();
    const age = viewerProfile?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(viewerProfile.dateOfBirth as string).getTime()) / 31557600000,
        )
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
      ...(discoveryCtx ? {
        discoveryScore: discoveryCtx.matchScore,
        discoveryRank: discoveryCtx.rank,
      } : {}),
      createdAt: now,
    });
  }

  async getProfileViews(userId: string, limit = 30): Promise<ViewRecord[]> {
    const result = await this.query<ViewRecord>(`USER#${userId}`, {
      limit: limit + 20,
      scanForward: false,
    });
    return result.items.filter((i) => i.SK.startsWith('VIEW#')).slice(0, limit);
  }

  // ── Notifications ─────────────────────────

  async createNotification(
    userId: string,
    data: {
      type: string;
      title: string;
      message: string;
      actionUrl?: string;
    },
  ): Promise<void> {
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
    const result = await this.query<NotificationRecord>(`USER#${userId}`, {
      limit: limit + 50,
      scanForward: false,
    });
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
