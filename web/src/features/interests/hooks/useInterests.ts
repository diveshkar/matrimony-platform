import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interestApi } from '../api/interest-api';

export function useInbox() {
  return useQuery({
    queryKey: ['interests', 'inbox'],
    queryFn: () => interestApi.getInbox(),
  });
}

export function useOutbox() {
  return useQuery({
    queryKey: ['interests', 'outbox'],
    queryFn: () => interestApi.getOutbox(),
  });
}

export function useSendInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      interestApi.send(receiverId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
    },
  });
}

export function useRespondInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: 'accept' | 'decline' }) =>
      interestApi.respond(senderId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
    },
  });
}

export function useShortlist() {
  return useQuery({
    queryKey: ['shortlist'],
    queryFn: () => interestApi.getShortlist(),
  });
}

export function useAddToShortlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => interestApi.addToShortlist(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist'] });
    },
  });
}

export function useRemoveFromShortlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => interestApi.removeFromShortlist(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist'] });
    },
  });
}
