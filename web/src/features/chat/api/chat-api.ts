import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface ConversationItem {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface MessageItem {
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export const chatApi = {
  getConversations: () =>
    apiClient.get<ApiResponse<{ items: ConversationItem[] }>>('/chats').then((r) => r.data),

  createConversation: (otherUserId: string) =>
    apiClient
      .post<ApiResponse<{ conversationId: string }>>('/chats', { otherUserId })
      .then((r) => r.data),

  getMessages: (conversationId: string, limit = 50, cursor?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return apiClient
      .get<
        ApiResponse<{ items: MessageItem[]; nextCursor?: string }>
      >(`/chats/${conversationId}/messages?${params}`)
      .then((r) => r.data);
  },

  sendMessage: (conversationId: string, content: string) =>
    apiClient
      .post<ApiResponse<{ message: MessageItem }>>(`/chats/${conversationId}/messages`, { content })
      .then((r) => r.data),
};
