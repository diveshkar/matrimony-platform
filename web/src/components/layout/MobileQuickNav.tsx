import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Sparkles, Search, Star, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

const items = [
  { label: 'Home', href: ROUTES.DASHBOARD, icon: Home },
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Compass },
  { label: 'Recently Joined', href: ROUTES.RECENTLY_JOINED, icon: Sparkles },
  { label: 'Search', href: ROUTES.SEARCH, icon: Search },
  { label: 'Shortlist', href: ROUTES.SHORTLIST, icon: Star },
  { label: 'Viewed', href: ROUTES.WHO_VIEWED, icon: Eye },
];

// Only show the quick-nav on browsing surfaces where jumping between
// lists is the natural flow. On focused pages (chat threads, edit forms,
// settings, payments, profile detail) it's a distraction, so hide.
const allowedRoutes: string[] = [
  ROUTES.DASHBOARD,
  ROUTES.DISCOVER,
  ROUTES.RECENTLY_JOINED,
  ROUTES.SEARCH,
  ROUTES.SHORTLIST,
  ROUTES.WHO_VIEWED,
  ROUTES.INTERESTS,
];

/**
 * Sticky horizontal quick-nav below the main header. Mobile-only —
 * desktop already has the full nav inline in the header. Stays pinned
 * while the page scrolls and the items don't animate or shift.
 */
export function MobileQuickNav() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;
  if (!allowedRoutes.includes(location.pathname)) return null;

  return (
    <nav className="md:hidden sticky top-16 z-30 w-full border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-stretch gap-1 px-2 py-2 min-w-max">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg shrink-0 min-w-[64px]',
                  isActive
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
