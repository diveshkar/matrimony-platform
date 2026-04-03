import { Link, useLocation } from 'react-router-dom';
import { Heart, Search, MessageCircle, Bell, User, Settings, LogOut, Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const authLinks = [
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Search },
  { label: 'Interests', href: ROUTES.INTERESTS, icon: Heart },
  { label: 'Chats', href: ROUTES.CHATS, icon: MessageCircle },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { label: 'My Profile', href: ROUTES.MY_PROFILE, icon: User },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
];

const publicLinks = [
  { label: 'About', href: ROUTES.ABOUT, icon: HelpCircle },
  { label: 'Safety', href: ROUTES.SAFETY, icon: Shield },
  { label: 'Plans', href: ROUTES.PLANS, icon: Heart },
  { label: 'FAQ', href: ROUTES.FAQ, icon: HelpCircle },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!open) return null;

  const links = isAuthenticated ? authLinks : publicLinks;

  return (
    <div className="md:hidden border-t bg-white animate-fade-in">
      <nav className="page-container py-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === link.href
                ? 'text-primary-800 bg-primary-50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </Link>
        ))}

        <Separator className="my-3" />

        {isAuthenticated ? (
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" asChild onClick={onClose}>
              <Link to={ROUTES.LOGIN}>Log In</Link>
            </Button>
            <Button asChild onClick={onClose}>
              <Link to={ROUTES.LOGIN}>Get Started</Link>
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
}
