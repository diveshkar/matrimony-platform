import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  MessageCircle,
  Heart,
  User,
  Crown,
  Settings,
  Eye,
  Camera,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/lib/auth/auth-context';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { useNotifications, useMarkAllRead } from '@/features/settings/hooks/useSettings';
import { useConversations } from '@/features/chat/hooks/useChat';
import { formatRelativeTime } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import { MobileNav } from './MobileNav';

const publicNavLinks = [
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Safety', href: ROUTES.SAFETY },
  { label: 'Plans', href: '/#plans' },
  { label: 'FAQ', href: ROUTES.FAQ },
];

const authNavLinks = [
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Heart },
  { label: 'Interests', href: ROUTES.INTERESTS, icon: Heart },
];

export function Header() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = isAuthenticated ? authNavLinks : publicNavLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="page-container flex h-16 items-center justify-between">
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              aria-current={location.pathname === link.href ? 'page' : undefined}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                location.pathname === link.href
                  ? 'text-primary-800 bg-primary-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <PlanBadge />
              <ChatBadge />
              <NotificationBell />
              <SettingsDropdown />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to={ROUTES.LOGIN}>Log In</Link>
              </Button>
              <Button asChild>
                <Link to={ROUTES.LOGIN}>Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          {isAuthenticated && <ChatBadge />}
          {isAuthenticated && <NotificationBell />}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

/* ── Notification Bell with Dropdown ──────── */

function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { data: response, refetch } = useNotifications(isAuthenticated);
  const markAll = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = response?.success ? response.data.items.slice(0, 5) : [];
  const unreadCount = response?.success ? response.data.unreadCount : 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop on mobile */}
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setOpen(false)} />
        <div className="fixed right-2 left-2 top-16 md:absolute md:right-0 md:left-auto md:top-auto mt-2 md:w-80 rounded-2xl border bg-white shadow-soft-xl z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-heading font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAll.mutate(undefined, { onSuccess: () => refetch() });
                }}
                className="text-[10px] text-primary-700 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.notificationId}
                  to={n.actionUrl || ROUTES.NOTIFICATIONS}
                  onClick={() => {
                    setOpen(false);
                    if (!n.isRead && n.SK) {
                      import('@/features/settings/api/settings-api').then(({ settingsApi }) => {
                        settingsApi.markNotificationRead(n.SK).then(() => refetch());
                      });
                    }
                  }}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-warm-50 transition-colors border-b last:border-b-0',
                    !n.isRead && 'bg-primary-50/30',
                  )}
                >
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full mt-1.5 shrink-0',
                      n.isRead ? 'bg-transparent' : 'bg-primary-700',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs', !n.isRead && 'font-semibold')}>{n.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{n.message}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <Link
            to={ROUTES.NOTIFICATIONS}
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-primary-700 font-medium py-3 border-t hover:bg-warm-50 transition-colors rounded-b-2xl"
          >
            View All Notifications
          </Link>
        </div>
        </>
      )}
    </div>
  );
}

/* ── Settings Dropdown ────────────────────── */

const settingsMenuItems = [
  { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User },
  { label: 'My Photos', href: ROUTES.MY_PHOTOS, icon: Camera },
  { label: 'Who Viewed Me', href: ROUTES.WHO_VIEWED, icon: Eye },
  { label: 'Manage Plan', href: ROUTES.PLANS, icon: Crown },
  { label: 'All Settings', href: ROUTES.SETTINGS, icon: Settings },
];

function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Settings className="h-5 w-5" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-soft-xl z-50 animate-fade-in">
          <div className="py-1">
            {settingsMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-warm-50 transition-colors"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}

            <div className="border-t my-1" />

            <button
              onClick={() => {
                setOpen(false);
                logout.mutate();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Plan Badge ───────────────────────────── */

function ChatBadge() {
  const { isAuthenticated } = useAuth();
  const { data: subResponse } = useMySubscription();
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const hasChatAccess = planId !== 'free';
  const { data } = useConversations();

  if (!isAuthenticated) return null;

  const totalUnread = data?.success
    ? data.data.items.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0)
    : 0;

  return (
    <Link to={hasChatAccess ? ROUTES.CHATS : ROUTES.PLANS}>
      <Button variant="ghost" size="icon" className="relative">
        <MessageCircle className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1",
            hasChatAccess ? "bg-primary-700" : "bg-muted-foreground",
          )}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </Button>
    </Link>
  );
}

function PlanBadge() {
  const { data: subResponse } = useMySubscription();
  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';

  if (planId === 'free') {
    return (
      <Link to={ROUTES.PLANS}>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary-50 transition-colors">
          <Crown className="mr-1 h-3 w-3" />
          Upgrade
        </Badge>
      </Link>
    );
  }

  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);
  return (
    <Link to={ROUTES.PLANS}>
      <Badge variant="gold" className="cursor-pointer">
        <Crown className="mr-1 h-3 w-3" />
        {planLabel}
      </Badge>
    </Link>
  );
}
