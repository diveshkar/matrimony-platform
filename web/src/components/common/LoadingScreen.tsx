import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingScreenProps {
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ className, message, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'min-h-screen bg-background',
        className,
      )}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-primary-200 border-t-primary-700 animate-spin" />
        <Heart className="absolute inset-0 m-auto h-5 w-5 text-primary-700 animate-pulse-soft" />
      </div>
      {message && <p className="text-sm text-muted-foreground animate-fade-in">{message}</p>}
    </div>
  );
}
