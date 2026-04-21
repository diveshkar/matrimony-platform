import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { photoApi } from '../api/photo-api';
import { useToast } from '@/components/ui/toaster';

export function useMyPhotos() {
  return useQuery({
    queryKey: ['my-photos'],
    queryFn: () => photoApi.getPhotos(),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const urlResponse = await photoApi.getUploadUrl(file.name, file.type, file.size);
      if (!urlResponse.success) throw new Error('Failed to get upload URL');

      const { uploadUrl, s3Key } = urlResponse.data;
      await photoApi.uploadFile(uploadUrl, file);

      const confirmResponse = await photoApi.confirmUpload({
        s3Key,
        fileSize: file.size,
        mimeType: file.type,
      });

      return confirmResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Photo uploaded');
    },
    onError: () => {
      toast.error('Upload failed', 'Please try again');
    },
  });
}

export function useSetPrimaryPhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (photoId: string) => photoApi.setPrimary(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Primary photo updated');
    },
  });
}

export function useUpdatePhotoVisibility() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ photoId, visibility }: { photoId: string; visibility: string }) =>
      photoApi.updateVisibility(photoId, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      toast.success('Visibility updated');
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (photoId: string) => photoApi.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Photo deleted');
    },
  });
}
