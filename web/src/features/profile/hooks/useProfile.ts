import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { profileApi, type ProfileData } from '../api/profile-api';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';

export function useMyProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileApi.getMyProfile(),
    enabled: isAuthenticated,
  });
}

export function useCreateProfile() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileData) => profileApi.create(data),
    onSuccess: () => {
      updateUser({ hasProfile: true, onboardingComplete: true });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProfileData>) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}
