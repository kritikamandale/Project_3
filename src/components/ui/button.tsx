import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-[var(--radius-md)] transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-[var(--pichwai-gold)] text-[var(--pichwai-dark-brown)] hover:bg-[var(--pichwai-gold-deep)] shadow-[var(--shadow-card)]',
        pichwai:
          'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-[#3E2000] border border-[rgba(201,147,58,0.5)] hover:from-[#B8860B] hover:to-[#C9933A] shadow-[0_2px_12px_rgba(201,147,58,0.3)] font-semibold',
        secondary:
          'bg-[var(--pichwai-peacock)] text-white hover:bg-[var(--pichwai-peacock-deep)] shadow-[var(--shadow-card)]',
        outline:
          'border border-[var(--border-gold)] bg-transparent text-[var(--foreground)] hover:bg-[rgba(201,147,58,0.06)]',
        ghost:
          'bg-transparent text-[var(--foreground)] hover:bg-[rgba(62,32,0,0.06)]',
        destructive:
          'bg-[var(--pichwai-ruby)] text-white hover:bg-[var(--pichwai-ruby-deep)]',
        link:
          'underline-offset-4 hover:underline text-[var(--pichwai-gold)] bg-transparent p-0 h-auto',
        saffron:
          'bg-gradient-to-r from-[#E08000] to-[#FFC330] text-white hover:from-[#B35E00] hover:to-[#E08000] shadow-md font-semibold',
      },
      size: {
        sm:   'h-8  px-3 text-sm',
        md:   'h-10 px-5 text-sm',
        lg:   'h-12 px-7 text-base',
        xl:   'h-14 px-9 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
