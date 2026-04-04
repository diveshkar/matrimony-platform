import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings-api';
import { useToast } from '@/components/ui/toaster';

export function useBlockedUsers() {
  return useQuery({ queryKey: ['blocked'], queryFn: () => settingsApi.getBlocked() });
}

export function useBlockUser() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (userId: string) => settingsApi.blockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked'] });
      toast.success('User blocked');
    },
    onError: () => toast.error('Failed to block user'),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (userId: string) => settingsApi.unblockUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked'] });
      toast.info('User unblocked');
    },
  });
}

export function useReportUser() {
  const toast = useToast();
  return useMutation({
    mutationFn: (data: { reportedUserId: string; reason: string; description?: string }) =>
      settingsApi.reportUser(data),
    onSuccess: () => toast.success('Report submitted', 'Our team will review it within 24 hours'),
    onError: () => toast.error('Failed to submit report'),
  });
}

export function useWhoViewedMe() {
  return useQuery({ queryKey: ['who-viewed-me'], queryFn: () => settingsApi.getWhoViewedMe() });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => settingsApi.getNotifications(),
    refetchInterval: 30000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function usePrivacySettings() {
  return useQuery({ queryKey: ['privacy'], queryFn: () => settingsApi.getPrivacy() });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.updatePrivacy(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privacy'] });
      toast.success('Privacy settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });
}
