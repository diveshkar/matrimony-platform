import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type AuthStartRequest, type AuthVerifyRequest } from '../api/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';

export function useAuthStart() {
  return useMutation({
    mutationFn: (data: AuthStartRequest) => authApi.start(data),
  });
}

export function useAuthVerify() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: AuthVerifyRequest) => authApi.verify(data),
    onSuccess: (response) => {
      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;
        login(accessToken, refreshToken, {
          id: user.id,
          phone: user.phone,
          email: user.email,
          hasProfile: user.hasProfile,
          onboardingComplete: user.onboardingComplete,
        });

        if (!user.onboardingComplete) {
          navigate(ROUTES.ONBOARDING, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
      }
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      navigate(ROUTES.HOME, { replace: true });
    },
  });
}
