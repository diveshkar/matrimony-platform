import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const { isAuthenticated } = useAuth();
  const linkTo = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME;

  return (
    <Link to={linkTo} className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow',
          sizes[size],
        )}
      >
        <Heart className="h-1/2 w-1/2 fill-accent-400 text-accent-400" />
      </div>
      {showText && (
        <span
          className={cn(
            'font-heading font-bold text-primary-800 whitespace-nowrap hidden sm:inline',
            textSizes[size],
          )}
        >
          {CONFIG.APP_NAME}
        </span>
      )}
    </Link>
  );
}
