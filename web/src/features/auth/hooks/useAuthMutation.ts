import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type AuthStartRequest, type AuthVerifyRequest } from '../api/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toaster';
import { ROUTES } from '@/lib/constants/routes';

export function useAuthStart() {
  const toast = useToast();

  return useMutation({
    mutationFn: (data: AuthStartRequest) => authApi.start(data),
    onSuccess: () => {
      toast.success('OTP sent', 'Check your phone or email for the verification code');
    },
    onError: () => {
      toast.error('Failed to send OTP', 'Please try again');
    },
  });
}

export function useAuthVerify() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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

        toast.success('Welcome!', user.onboardingComplete ? 'Good to see you again' : 'Let\'s set up your profile');

        if (!user.onboardingComplete) {
          navigate(ROUTES.ONBOARDING, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
      }
    },
    onError: () => {
      toast.error('Verification failed', 'Invalid or expired OTP');
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      toast.info('Logged out', 'See you soon!');
      navigate(ROUTES.HOME, { replace: true });
    },
  });
}
