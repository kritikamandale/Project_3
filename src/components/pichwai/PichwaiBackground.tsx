'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface PichwaiBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'rich';
  parallax?: boolean;
}

export function PichwaiBackground({
  className,
  intensity = 'subtle',
  parallax  = true,
}: PichwaiBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, parallax ? -60 : 0]);

  const opacityMap = { subtle: 0.04, medium: 0.07, rich: 0.12 } as const;
  const opacity    = opacityMap[intensity];

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Lotus tile pattern */}
      <motion.div
        style={{ y }}
        className="absolute inset-0"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='%23C9933A' fill-opacity='1'%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' /%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(45 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(90 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(135 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(180 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(225 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(270 60 60)'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='22' transform='rotate(315 60 60)'/%3E%3Ccircle cx='60' cy='60' r='8'/%3E%3Ccircle cx='60' cy='60' r='4' fill='%238B621A'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            opacity,
          }}
        />
      </motion.div>

      {/* Soft radial gradient overlay to blend edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, var(--background) 100%)',
        }}
      />
    </div>
  );
}

export function PichwaiHeroBg({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8E7] via-[#FFF2D0] to-[#FFE0B0]" />

      {/* Lotus tile at low opacity */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='%23C9933A' fill-opacity='0.08'%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' /%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(45 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(90 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(135 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(180 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(225 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(270 80 80)'/%3E%3Cellipse cx='80' cy='45' rx='10' ry='32' transform='rotate(315 80 80)'/%3E%3Ccircle cx='80' cy='80' r='12'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />

      {/* Warm vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,147,58,0.12) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
