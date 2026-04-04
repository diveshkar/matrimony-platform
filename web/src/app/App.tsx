import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNoIndex } from '@/hooks/useNoIndex';
import { ScrollToTop } from '@/components/common/ScrollToTop';

function AppContent() {
  usePageTitle();
  useNoIndex();
  return (
    <>
      <AppRouter />
      <ScrollToTop />
    </>
  );
}

export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
