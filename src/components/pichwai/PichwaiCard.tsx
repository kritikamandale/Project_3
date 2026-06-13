import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface PichwaiCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

function CornerDecoration({ className }: { className?: string }) {
  return (
    <svg
      width="36" height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('absolute', className)}
      aria-hidden="true"
    >
      {/* L-shaped gold border lines */}
      <path d="M2 36 L2 4 Q2 2 4 2 L36 2" stroke="#C9933A" strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      {/* Small decorative flower */}
      <g transform="translate(10,10)">
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse key={i} cx="0" cy="-4" rx="1.8" ry="3.5"
            fill="#C9933A" fillOpacity="0.7"
            transform={`rotate(${deg})`} />
        ))}
        <circle cx="0" cy="0" r="2" fill="#E8C06B" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

function LotusWatermark() {
  return (
    <svg
      width="80" height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute bottom-3 right-3 opacity-[0.05] pointer-events-none"
      aria-hidden="true"
    >
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <ellipse key={i} cx="40" cy="22" rx="7" ry="20"
          fill="#C9933A"
          transform={`rotate(${deg} 40 40)`} />
      ))}
      <circle cx="40" cy="40" r="10" fill="#C9933A" />
      <circle cx="40" cy="40" r="6" fill="#E8C06B" />
    </svg>
  );
}

export const PichwaiCard = forwardRef<HTMLDivElement, PichwaiCardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-md)]',
          variant === 'default'  && 'bg-[var(--card-bg)] border border-[var(--border-gold)] shadow-[var(--shadow-card)]',
          variant === 'elevated' && 'bg-[var(--card-bg)] border border-[var(--border-gold)] shadow-[var(--shadow-pichwai)]',
          variant === 'outlined' && 'bg-transparent border-2 border-[rgba(201,147,58,0.4)]',
          className
        )}
        {...props}
      >
        {/* Corner decorations */}
        <CornerDecoration className="top-0 left-0" />
        <CornerDecoration className="top-0 right-0 rotate-90" />
        <CornerDecoration className="bottom-0 left-0 -rotate-90" />
        <CornerDecoration className="bottom-0 right-0 rotate-180" />

        {/* Lotus watermark */}
        <LotusWatermark />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

PichwaiCard.displayName = 'PichwaiCard';
