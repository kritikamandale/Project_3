'use client';

import { motion } from 'framer-motion';
import { lotus_bloom } from '@/lib/animations';

interface LotusLoaderProps {
  size?: number;
  color?: string;
  className?: string;
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function LotusLoader({
  size  = 80,
  color = '#FFC330',
  className,
}: LotusLoaderProps) {
  const centerColor = '#E08000';

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PETAL_ANGLES.map((angle, i) => (
          <motion.ellipse
            key={angle}
            cx="40"
            cy="22"
            rx="6"
            ry="17"
            fill={color}
            fillOpacity={i % 2 === 0 ? 0.9 : 0.65}
            custom={i}
            variants={lotus_bloom}
            initial="hidden"
            animate="visible"
            style={{ originX: '40px', originY: '40px' }}
            transform={`rotate(${angle} 40 40)`}
          />
        ))}

        {/* Pulsing center */}
        <motion.circle
          cx="40" cy="40" r="10"
          fill={centerColor}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '40px', originY: '40px' }}
        />
        <motion.circle
          cx="40" cy="40" r="5"
          fill="#FFD87A"
          animate={{ scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          style={{ originX: '40px', originY: '40px' }}
        />
      </svg>
    </div>
  );
}

export function LotusPageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] z-50">
      <div className="flex flex-col items-center gap-4">
        <LotusLoader size={96} />
        <p className="font-cinzel text-sm text-[var(--pichwai-gold)] tracking-widest uppercase opacity-70">
          Milap
        </p>
      </div>
    </div>
  );
}
