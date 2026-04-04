import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse-soft rounded-lg bg-muted', className)} {...props} />;
}

export { Skeleton };
