import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface InterestItem {
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

export interface ShortlistItem {
  userId: string;
  targetUserId: string;
  targetName?: string;
  targetPhoto?: string;
  targetAge?: number;
  targetCity?: string;
  targetCountry?: string;
  createdAt: string;
}

export const interestApi = {
  send: (receiverId: string, message?: string) =>
    apiClient
      .post<ApiResponse<{ status: string }>>('/interests', { receiverId, message })
      .then((r) => r.data),

  respond: (senderId: string, action: 'accept' | 'decline') =>
    apiClient
      .post<ApiResponse<{ status: string }>>(`/interests/${senderId}/respond`, { action })
      .then((r) => r.data),

  withdraw: (receiverId: string) =>
    apiClient
      .delete<ApiResponse<{ status: string }>>(`/interests/${receiverId}`)
      .then((r) => r.data),

  getInbox: () =>
    apiClient
      .get<ApiResponse<{ items: InterestItem[] }>>('/interests?type=inbox')
      .then((r) => r.data),

  getOutbox: () =>
    apiClient
      .get<ApiResponse<{ items: InterestItem[] }>>('/interests?type=outbox')
      .then((r) => r.data),

  getShortlist: () =>
    apiClient.get<ApiResponse<{ items: ShortlistItem[] }>>('/shortlist').then((r) => r.data),

  addToShortlist: (targetUserId: string) =>
    apiClient
      .post<ApiResponse<{ status: string }>>('/shortlist', { targetUserId })
      .then((r) => r.data),

  removeFromShortlist: (targetUserId: string) =>
    apiClient
      .delete<ApiResponse<{ status: string }>>(`/shortlist/${targetUserId}`)
      .then((r) => r.data),
};
