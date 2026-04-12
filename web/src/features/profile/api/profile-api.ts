import { apiClient, type ApiResponse } from '@/lib/api/client';

export interface ProfileData {
  profileFor: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  height: number;
  maritalStatus: string;
  hasChildren: boolean;
  childrenCount?: number;
  phoneNumber?: string;
  religion: string;
  caste?: string;
  subCaste?: string;
  denomination?: string;
  motherTongue: string;
  raasi?: string;
  natchathiram?: string;
  education: string;
  educationField?: string;
  occupation?: string;
  employer?: string;
  incomeRange?: string;
  country: string;
  state?: string;
  city?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  brothersCount?: number;
  brothersMarried?: number;
  sistersCount?: number;
  sistersMarried?: number;
  familyType?: string;
  familyStatus?: string;
  familyValues?: string;
  aboutMe?: string;
  preferences?: {
    ageMin: number;
    ageMax: number;
    heightMin?: number;
    heightMax?: number;
    religions?: string[];
    castes?: string[];
    educations?: string[];
    countries?: string[];
    maritalStatuses?: string[];
  };
}

export interface ProfileResponse {
  profile: ProfileData & {
    userId: string;
    primaryPhotoUrl?: string;
    profileCompletion: number;
    createdAt: string;
    updatedAt: string;
  };
  preferences: Record<string, unknown> | null;
  privacy: Record<string, unknown> | null;
}

export const profileApi = {
  create: (data: ProfileData) =>
    apiClient.post<ApiResponse<ProfileResponse['profile']>>('/profiles', data).then((r) => r.data),

  getMyProfile: () => apiClient.get<ApiResponse<ProfileResponse>>('/me').then((r) => r.data),

  updateProfile: (data: Partial<ProfileData>) =>
    apiClient.patch<ApiResponse<Record<string, unknown>>>('/me', data).then((r) => r.data),

  getProfile: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/profiles/${id}`).then((r) => r.data),

  getBoostStatus: () =>
    apiClient.get<ApiResponse<{
      isActive: boolean;
      expiresAt: string | null;
      boostsUsed: number;
      boostsTotal: number;
      canBoost: boolean;
    }>>('/me/boost').then((r) => r.data),

  activateBoost: () =>
    apiClient.post<ApiResponse<{
      status: string;
      expiresAt: string;
      boostsUsed: number;
      boostsTotal: number;
    }>>('/me/boost').then((r) => r.data),
};
