import { apiClient, type ApiResponse } from '@/lib/api/client';
import axios from 'axios';

export interface PhotoData {
  PK: string;
  SK: string;
  userId: string;
  photoId: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  visibility: 'all' | 'contacts' | 'hidden';
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export const photoApi = {
  getUploadUrl: (fileName: string, mimeType: string, fileSize: number) =>
    apiClient
      .post<ApiResponse<{ uploadUrl: string; photoId: string; s3Key: string }>>(
        '/uploads/photo-url',
        {
          fileName,
          mimeType,
          fileSize,
        },
      )
      .then((r) => r.data),

  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    });
  },

  confirmUpload: (data: {
    s3Key: string;
    fileSize: number;
    mimeType: string;
    visibility?: string;
  }) => apiClient.post<ApiResponse<PhotoData>>('/uploads/photo-confirm', data).then((r) => r.data),

  getPhotos: () => apiClient.get<ApiResponse<PhotoData[]>>('/uploads/photos').then((r) => r.data),

  setPrimary: (photoId: string) =>
    apiClient
      .patch<ApiResponse<{ message: string }>>(`/uploads/photos/${photoId}`, { isPrimary: true })
      .then((r) => r.data),

  updateVisibility: (photoId: string, visibility: string) =>
    apiClient
      .patch<ApiResponse<{ message: string }>>(`/uploads/photos/${photoId}`, { visibility })
      .then((r) => r.data),

  deletePhoto: (photoId: string) =>
    apiClient
      .delete<ApiResponse<{ message: string }>>(`/uploads/photos/${photoId}`)
      .then((r) => r.data),
};
