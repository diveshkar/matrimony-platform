import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interestApi } from '../api/interest-api';
import { useToast } from '@/components/ui/toaster';

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
  const toast = useToast();

  return useMutation({
    mutationFn: ({ receiverId, message }: { receiverId: string; message?: string }) =>
      interestApi.send(receiverId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
      toast.success('Interest sent!', 'They will be notified');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Please try again';
      toast.error('Failed to send interest', msg);
    },
  });
}

export function useWithdrawInterest() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (receiverId: string) => interestApi.withdraw(receiverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      toast.info('Interest withdrawn');
    },
    onError: () => {
      toast.error('Failed to withdraw interest');
    },
  });
}

export function useRespondInterest() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ senderId, action }: { senderId: string; action: 'accept' | 'decline' }) =>
      interestApi.respond(senderId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (variables.action === 'accept') {
        toast.success('Interest accepted!', 'You can now chat with each other');
      } else {
        toast.info('Interest declined');
      }
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
  const toast = useToast();

  return useMutation({
    mutationFn: (targetUserId: string) => interestApi.addToShortlist(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist'] });
      toast.success('Saved to shortlist');
    },
    onError: () => {
      toast.error('Failed to save');
    },
  });
}

export function useRemoveFromShortlist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (targetUserId: string) => interestApi.removeFromShortlist(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortlist'] });
      toast.info('Removed from shortlist');
    },
  });
}
