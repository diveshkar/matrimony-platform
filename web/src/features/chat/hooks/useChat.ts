import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type MessageItem } from '../api/chat-api';
import { CONFIG } from '@/lib/constants/config';
import type { ApiResponse } from '@/lib/api/client';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: CONFIG.CHAT_POLL_INTERVAL_MS,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: CONFIG.CHAT_POLL_INTERVAL_MS,
  });
}

type MessagesQueryData = ApiResponse<{ items: MessageItem[]; nextCursor?: string }>;

export function useSendMessage(conversationId: string, currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', conversationId];

  return useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(conversationId, content),

    // Optimistic update: drop a placeholder message into the cache before
    // the network round-trip. If the request fails, onError reverts.
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MessagesQueryData>(queryKey);

      const placeholder: MessageItem = {
        conversationId,
        messageId: `pending-${Date.now()}`,
        senderId: currentUserId || '',
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<MessagesQueryData>(queryKey, (old) => {
        if (!old || !old.success) return old;
        return {
          ...old,
          data: { ...old.data, items: [...old.data.items, placeholder] },
        };
      });

      return { previous };
    },

    onError: (_err, _content, context) => {
      // Roll back to whatever was in cache before the optimistic insert.
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      // Refetch authoritative state regardless of success/failure so the
      // placeholder gets replaced with the real server-issued message.
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otherUserId: string) => chatApi.createConversation(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
