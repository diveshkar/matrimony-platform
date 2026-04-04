import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toaster';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
