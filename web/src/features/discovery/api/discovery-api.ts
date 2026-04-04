import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface DiscoveryProfile {
  userId: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  religion: string;
  caste?: string;
  motherTongue: string;
  education: string;
  occupation?: string;
  country: string;
  state?: string;
  city?: string;
  maritalStatus: string;
  primaryPhotoUrl?: string;
  profileCompletion: number;
  aboutMe?: string;
  lastActiveAt: string;
}

export interface DiscoveryResponse {
  items: DiscoveryProfile[];
  nextCursor?: string;
}

export interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  country?: string;
  religion?: string;
  caste?: string;
  education?: string;
  maritalStatus?: string;
  hasPhoto?: boolean;
  limit?: number;
  cursor?: string;
}

export const discoveryApi = {
  getRecommendations: (limit = 20, cursor?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return apiClient.get<ApiResponse<DiscoveryResponse>>(`/discover?${params}`).then((r) => r.data);
  },

  search: (filters: SearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return apiClient
      .get<ApiResponse<DiscoveryResponse>>(`/discover/search?${params}`)
      .then((r) => r.data);
  },
};
