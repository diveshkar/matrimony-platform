import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface AuthStartRequest {
  phone?: string;
  email?: string;
}

export interface AuthStartResponse {
  message: string;
  identifier: string;
}

export interface AuthVerifyRequest {
  phone?: string;
  email?: string;
  otp: string;
}

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  matrimonyId: string;
  hasProfile: boolean;
  onboardingComplete: boolean;
}

export interface AuthVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  isNewUser: boolean;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  start: (data: AuthStartRequest) =>
    apiClient.post<ApiResponse<AuthStartResponse>>('/auth/start', data).then((r) => r.data),

  verify: (data: AuthVerifyRequest) =>
    apiClient.post<ApiResponse<AuthVerifyResponse>>('/auth/verify', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<AuthRefreshResponse>>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  logout: () =>
    apiClient.post<ApiResponse<{ message: string }>>('/auth/logout').then((r) => r.data),

  me: () => apiClient.get<ApiResponse<AuthUser>>('/auth/me').then((r) => r.data),
};
