import { useMutation, useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription-api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.getPlans(),
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionApi.getMySubscription(),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => subscriptionApi.getUsage(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
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
