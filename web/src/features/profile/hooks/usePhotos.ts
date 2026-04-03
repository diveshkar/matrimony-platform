import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { photoApi } from '../api/photo-api';

export function useMyPhotos() {
  return useQuery({
    queryKey: ['my-photos'],
    queryFn: () => photoApi.getPhotos(),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get upload URL
      const urlResponse = await photoApi.getUploadUrl(file.name, file.type, file.size);
      if (!urlResponse.success) throw new Error('Failed to get upload URL');

      const { uploadUrl, s3Key } = urlResponse.data;

      // Step 2: Upload file
      const fileUrl = await photoApi.uploadFile(uploadUrl, file);

      // Step 3: Confirm upload
      const confirmResponse = await photoApi.confirmUpload({
        s3Key,
        url: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      });

      return confirmResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useSetPrimaryPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photoApi.setPrimary(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useUpdatePhotoVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, visibility }: { photoId: string; visibility: string }) =>
      photoApi.updateVisibility(photoId, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photoApi.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}
