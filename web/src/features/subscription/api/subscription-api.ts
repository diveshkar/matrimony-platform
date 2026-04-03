import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface PlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  entitlements: {
    profileViewsPerDay: number;
    interestsPerDay: number;
    chatAccess: boolean;
    contactInfoAccess: boolean;
    whoViewedMeAccess: boolean;
    boostsPerMonth: number;
  } | null;
}

export interface MySubscription {
  subscription: {
    planId: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  entitlements: {
    profileViewsPerDay: number;
    interestsPerDay: number;
    chatAccess: boolean;
    contactInfoAccess: boolean;
    whoViewedMeAccess: boolean;
    boostsPerMonth: number;
  };
}

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<ApiResponse<PlanInfo[]>>('/subscriptions/plans').then((r) => r.data),

  createCheckout: (planId: string) =>
    apiClient
      .post<ApiResponse<{ checkoutUrl: string; sessionId: string }>>('/subscriptions/checkout', { planId })
      .then((r) => r.data),

  getMySubscription: () =>
    apiClient.get<ApiResponse<MySubscription>>('/subscriptions/me').then((r) => r.data),
};
