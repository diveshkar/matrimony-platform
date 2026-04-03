import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-warm-50">
      <Header />
      <main className="flex-1 page-container py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
