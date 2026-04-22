import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { useMySubscription } from '@/features/subscription/hooks/useSubscription';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const mainLinks = [
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Search },
  { label: 'Interests', href: ROUTES.INTERESTS, icon: Heart },
  { label: 'Messages', href: ROUTES.CHATS, icon: MessageCircle },
  { label: 'Shortlist', href: ROUTES.SHORTLIST, icon: Star },
];

const profileLinks = [
  { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User },
  { label: 'My Photos', href: ROUTES.MY_PHOTOS, icon: Camera },
  { label: 'Who Viewed Me', href: ROUTES.WHO_VIEWED, icon: Eye },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
];

const settingsLinks = [
  { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
  { label: 'Privacy', href: ROUTES.PRIVACY_SETTINGS, icon: Shield },
  { label: 'Plans', href: ROUTES.PLANS, icon: Crown },
];

const publicLinks = [
  { label: 'About', href: ROUTES.ABOUT, icon: HelpCircle },
  { label: 'Safety', href: ROUTES.SAFETY, icon: Shield },
  { label: 'Plans', href: '/#plans', icon: Crown },
  { label: 'FAQ', href: ROUTES.FAQ, icon: HelpCircle },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { isAuthenticated } = useAuth();
  const logout = useLogout();
  const { data: subResponse } = useMySubscription();
  const location = useLocation();

  const planId = subResponse?.success ? subResponse.data.subscription.planId : 'free';
  const planLabel = planId.charAt(0).toUpperCase() + planId.slice(1);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Dropdown panel below header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 top-16 z-50 md:hidden bg-white border-b shadow-soft-xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {isAuthenticated ? (
              <div className="p-3 space-y-1">
                {/* Plan badge */}
                <div className="px-3 py-2 mb-1">
                  <Badge
                    variant={planId === 'free' ? 'outline' : 'gold'}
                    className="text-[9px]"
                  >
                    <Crown className="mr-1 h-2.5 w-2.5" />
                    {planLabel} Plan
                  </Badge>
                </div>

                {/* Main nav */}
                <NavSection label="Navigate">
                  {mainLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={onClose}
                    />
                  ))}
                </NavSection>

                {/* Profile */}
                <NavSection label="Profile">
                  {profileLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={onClose}
                    />
                  ))}
                </NavSection>

                {/* Settings */}
                <NavSection label="Account">
                  {settingsLinks.map((link) => (
                    <NavLink
                      key={link.href}
                      {...link}
                      active={location.pathname === link.href}
                      onClose={onClose}
                    />
                  ))}
                </NavSection>

                {/* Divider + Logout */}
                <div className="border-t my-2" />
                <button
                  onClick={() => {
                    onClose();
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {publicLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    active={location.pathname === link.href}
                    onClose={onClose}
                  />
                ))}

                <div className="flex flex-col gap-2 pt-3 px-1 border-t mt-2">
                  <Button variant="outline" className="rounded-lg" asChild onClick={onClose}>
                    <Link to={ROUTES.LOGIN}>Log In</Link>
                  </Button>
                  <Button className="rounded-lg" asChild onClick={onClose}>
                    <Link to={ROUTES.LOGIN}>Get Started</Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
    <div className="py-1">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'text-primary-800 bg-primary-50'
          : 'text-foreground hover:bg-warm-50',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          active ? 'text-primary-700' : 'text-muted-foreground',
        )}
      />
      {label}
    </Link>
  );
}
