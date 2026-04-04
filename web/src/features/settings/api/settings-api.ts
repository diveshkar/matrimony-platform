import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface BlockItem {
  blockedUserId: string;
  createdAt: string;
}

export interface ViewItem {
  viewerId: string;
  viewerName?: string;
  viewerPhoto?: string;
  viewerAge?: number;
  viewerCity?: string;
  viewerCountry?: string;
  createdAt: string;
}

export interface NotificationItem {
  SK: string;
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PrivacySettings {
  hidePhone: boolean;
  hideDob: boolean;
  photoVisibility: 'all' | 'contacts' | 'hidden';
  horoscopeVisibility: 'all' | 'contacts' | 'hidden';
  showInSearch: boolean;
}

export const settingsApi = {
  getBlocked: () =>
    apiClient.get<ApiResponse<{ items: BlockItem[] }>>('/blocks').then((r) => r.data),
  blockUser: (blockedUserId: string) =>
    apiClient
      .post<ApiResponse<{ status: string }>>('/blocks', { blockedUserId })
      .then((r) => r.data),
  unblockUser: (userId: string) =>
    apiClient.delete<ApiResponse<{ status: string }>>(`/blocks/${userId}`).then((r) => r.data),

  reportUser: (data: { reportedUserId: string; reason: string; description?: string }) =>
    apiClient.post<ApiResponse<{ status: string }>>('/reports', data).then((r) => r.data),

  getWhoViewedMe: () =>
    apiClient.get<ApiResponse<{ items: ViewItem[] }>>('/who-viewed-me').then((r) => r.data),

  getNotifications: () =>
    apiClient
      .get<ApiResponse<{ items: NotificationItem[]; unreadCount: number }>>('/notifications')
      .then((r) => r.data),
  markNotificationRead: (sk: string) =>
    apiClient.patch<ApiResponse<{ status: string }>>('/notifications', { sk }).then((r) => r.data),
  markAllRead: () =>
    apiClient
      .patch<ApiResponse<{ status: string }>>('/notifications', { markAllRead: true })
      .then((r) => r.data),

  getPrivacy: () =>
    apiClient.get<ApiResponse<PrivacySettings>>('/settings/privacy').then((r) => r.data),
  updatePrivacy: (data: Partial<PrivacySettings>) =>
    apiClient.patch<ApiResponse<{ status: string }>>('/settings/privacy', data).then((r) => r.data),
};
