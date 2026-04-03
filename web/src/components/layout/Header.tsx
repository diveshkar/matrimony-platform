import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, MessageCircle, Heart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/lib/auth/auth-context';
import { useLogout } from '@/features/auth/hooks/useAuthMutation';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import { MobileNav } from './MobileNav';

const publicNavLinks = [
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Safety', href: ROUTES.SAFETY },
  { label: 'Plans', href: ROUTES.PLANS },
  { label: 'FAQ', href: ROUTES.FAQ },
];

const authNavLinks = [
  { label: 'Discover', href: ROUTES.DISCOVER, icon: Heart },
  { label: 'Interests', href: ROUTES.INTERESTS, icon: Heart },
  { label: 'Chats', href: ROUTES.CHATS, icon: MessageCircle },
];

export function Header() {
  const { isAuthenticated } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to={ROUTES.NOTIFICATIONS}>
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to={ROUTES.MY_PROFILE}>
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout.mutate()}>
                <LogOut className="h-5 w-5" />
              </Button>
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

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
