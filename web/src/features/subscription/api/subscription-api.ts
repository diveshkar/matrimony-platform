import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface PlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  entitlements: {
    profileViewsPerDay: number;
    interestsPerDay: number;
    profileViewsPerMonth?: number;
    interestsPerMonth?: number;
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
    profileViewsPerMonth?: number;
    interestsPerMonth?: number;
    chatAccess: boolean;
    contactInfoAccess: boolean;
    whoViewedMeAccess: boolean;
    boostsPerMonth: number;
  };
}

export interface UsageData {
  profileViewsRemaining: number;
  interestsRemaining: number;
  profileViewsPeriod: 'day' | 'month';
  interestsPeriod: 'day' | 'month';
  chatAccess: boolean;
  whoViewedMeAccess: boolean;
  contactInfoAccess: boolean;
}

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<ApiResponse<PlanInfo[]>>('/subscriptions/plans').then((r) => r.data),

  createCheckout: (planId: string) =>
    apiClient
      .post<
        ApiResponse<{ checkoutUrl: string; sessionId: string }>
      >('/subscriptions/checkout', { planId })
      .then((r) => r.data),

  getMySubscription: () =>
    apiClient.get<ApiResponse<MySubscription>>('/subscriptions/me').then((r) => r.data),

  getUsage: () =>
    apiClient.get<ApiResponse<UsageData>>('/subscriptions/usage').then((r) => r.data),

  verifySession: (sessionId: string) =>
    apiClient
      .post<
        ApiResponse<{ status: string; planId: string }>
      >('/subscriptions/verify-session', { sessionId })
      .then((r) => r.data),

  cancel: () =>
    apiClient
      .post<ApiResponse<{ status: string }>>('/subscriptions/cancel')
      .then((r) => r.data),
};
