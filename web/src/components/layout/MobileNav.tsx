import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Menu,
  X,
  Heart,
  Search,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  Shield,
  HelpCircle,
  Crown,
  Star,
  Eye,
  Camera,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';
import { cn } from '@/lib/utils/cn';

const publicLinks = [
  { label: 'About', href: ROUTES.ABOUT, icon: HelpCircle },
  { label: 'Safety', href: ROUTES.SAFETY, icon: Shield },
  { label: 'Plans', href: '/#plans', icon: Crown },
  { label: 'FAQ', href: ROUTES.FAQ, icon: HelpCircle },
];

const authMainLinks = [
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Search },
  { label: 'Interests', href: ROUTES.INTERESTS, icon: Heart },
  { label: 'Messages', href: ROUTES.CHATS, icon: MessageCircle },
  { label: 'Shortlist', href: ROUTES.SHORTLIST, icon: Star },
];

const authProfileLinks = [
  { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User },
  { label: 'My Photos', href: ROUTES.MY_PHOTOS, icon: Camera },
  { label: 'Who Viewed Me', href: ROUTES.WHO_VIEWED, icon: Eye },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
];

const authSettingsLinks = [
  { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
  { label: 'Privacy', href: ROUTES.PRIVACY_SETTINGS, icon: Shield },
  { label: 'Plans', href: ROUTES.PLANS, icon: Crown },
];

export function MobileNav() {
  const { isAuthenticated } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const { data: subResponse } = useMySubscription();
  const [open, setOpen] = useState(false);

  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  // Auto-close on any navigation (path OR hash change)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const handleClose = () => setOpen(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        {/* Backdrop — darkens visible part of page */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden" />

        {/* Right-side drawer — 80% width, full height */}
        <DialogPrimitive.Content
          className={cn(
            'fixed right-0 top-0 z-50 h-full w-[85%] max-w-sm',
            'bg-white shadow-2xl flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'duration-300 ease-out md:hidden',
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <Heart className="h-4 w-4 fill-accent-400 text-accent-400" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm leading-none">Menu</p>
                <p className="text-[10px] text-white/60 mt-0.5">{CONFIG.APP_NAME}</p>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {isAuthenticated ? (
              <div className="py-2">
                {/* Plan badge */}
                <div className="px-5 py-3 border-b">
                  <Link
                    to={ROUTES.PLANS}
                    onClick={handleClose}
                    className="inline-flex items-center"
                  >
                    <Badge
                      variant={planId === 'free' ? 'outline' : 'gold'}
                      className="text-[10px]"
                    >
                      <Crown className="mr-1 h-3 w-3" />
                      {planLabel} Plan
                    </Badge>
                  </Link>
                </div>

                <NavSection label="Navigate">
                  {authMainLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={handleClose}
                    />
                  ))}
                </NavSection>

                <NavSection label="Profile">
                  {authProfileLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={handleClose}
                    />
                  ))}
                </NavSection>

                <NavSection label="Account">
                  {authSettingsLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={handleClose}
                    />
                  ))}
                </NavSection>

                <div className="border-t my-2" />

                <button
                  onClick={() => {
                    handleClose();
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="py-2">
                <NavSection label="Menu">
                  {publicLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={handleClose}
                    />
                  ))}
                </NavSection>
              </div>
            )}
          </div>

          {/* Sticky CTA footer for non-authenticated users */}
          {!isAuthenticated && (
            <div className="border-t p-4 space-y-2 bg-gradient-to-b from-warm-50 to-white">
              <Button variant="outline" className="w-full rounded-xl" asChild onClick={handleClose}>
                <Link to={ROUTES.LOGIN}>Log In</Link>
              </Button>
              <Button className="w-full rounded-xl shadow-glow" asChild onClick={handleClose}>
                <Link to={ROUTES.LOGIN}>Get Started</Link>
              </Button>
              <p className="text-center text-[10px] text-muted-foreground pt-2 flex items-center justify-center gap-1">
                <Heart className="h-2.5 w-2.5 fill-primary-400 text-primary-400" />
                Trusted by Tamil families worldwide
              </p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function NavSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  onClose,
}: {
  href: string;
  icon: typeof Heart;
  label: string;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClose}
      className={cn(
        'flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium transition-colors group',
        active
          ? 'text-primary-800 bg-primary-50'
          : 'text-foreground hover:bg-warm-50',
      )}
    >
      <div className="flex items-center gap-3">
        {active && (
          <div className="absolute left-0 h-6 w-1 bg-accent-500 rounded-r-full" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            active ? 'text-primary-700' : 'text-muted-foreground group-hover:text-foreground',
          )}
        />
        {label}
      </div>
      <ChevronRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-transform',
          active ? 'text-primary-600' : 'text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5',
        )}
      />
    </Link>
  );
}
