import { useMutation, useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription-api';
import { useAuth } from '@/lib/auth/auth-context';

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
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (planId: string) => subscriptionApi.createCheckout(planId),
    onSuccess: (response) => {
      if (response.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    },
  });
}
