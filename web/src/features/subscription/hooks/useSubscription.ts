import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription-api';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toaster';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.getPlans(),
  });
}

export function useMySubscription() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionApi.getMySubscription(),
    enabled: isAuthenticated,
  });
}

export function useUsage() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => subscriptionApi.getUsage(),
    staleTime: 1000 * 5,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useCreateCheckout() {
  const toast = useToast();
  return useMutation({
    mutationFn: (planId: string) => subscriptionApi.createCheckout(planId),
    onSuccess: (response) => {
      if (response.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = axiosErr?.response?.data?.error?.message || 'Could not start checkout. Please try again.';
      toast.error('Checkout failed', msg);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
    },
  });
}
