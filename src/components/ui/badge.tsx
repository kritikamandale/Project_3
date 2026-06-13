import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--pichwai-gold)] text-[var(--pichwai-dark-brown)]',
        secondary:
          'bg-[var(--muted)] text-[var(--muted-fg)]',
        outline:
          'border border-[var(--border-gold)] text-[var(--foreground)] bg-transparent',
        destructive:
          'bg-[var(--pichwai-ruby)] text-white',
        success:
          'bg-[var(--pichwai-leaf)] text-white',
        // Event type variants
        wedding:
          'bg-[#FCE4EC] text-[#880E4F] border border-[#F48FB1]',
        birthday:
          'bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]',
        puja:
          'bg-[#FFFDE7] text-[#F57F17] border border-[#FFF176]',
        corporate:
          'bg-[#E8EAF6] text-[#1A237E] border border-[#9FA8DA]',
        anniversary:
          'bg-[#FCE4EC] text-[#B71C1C] border border-[#EF9A9A]',
        'kiddie-party':
          'bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
