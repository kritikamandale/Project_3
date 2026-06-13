import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--muted)]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
