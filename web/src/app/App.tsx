import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNoIndex } from '@/hooks/useNoIndex';

function AppContent() {
  usePageTitle();
  useNoIndex();
  return <AppRouter />;
}

export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
