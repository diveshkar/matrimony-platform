import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileQuickNav } from './MobileQuickNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-warm-50">
      <Header />
      <MobileQuickNav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
