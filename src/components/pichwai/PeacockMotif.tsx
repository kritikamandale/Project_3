'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface PeacockMotifProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

// 12 tail feathers fanned in a semicircle (-75° to +75°)
const FEATHER_ANGLES = Array.from({ length: 12 }, (_, i) => -75 + i * (150 / 11));

// Jewel tones for the Pichwai peacock
const FEATHER_COLORS = [
  '#006994', '#008080', '#3D4FFF', '#22BB55', '#006994',
  '#004D70', '#008080', '#3D4FFF', '#189940', '#006994',
  '#4FB3CF', '#3D4FFF',
];

const EYE_COLORS = [
  '#C9933A', '#E8C06B', '#C9933A', '#FFC330', '#C9933A',
  '#E8C06B', '#C9933A', '#FFC330', '#C9933A', '#E8C06B',
  '#C9933A', '#FFC330',
];

export function PeacockMotif({ size = 200, className, animate: shouldAnimate = true }: PeacockMotifProps) {
  const scale = size / 200;

  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tail feathers — fanned from center-bottom (100, 160) */}
        {FEATHER_ANGLES.map((angle, i) => {
          const rad    = (angle * Math.PI) / 180;
          const length = 75 + (i % 3) * 8;
          const ex     = 100 + Math.sin(rad) * length;
          const ey     = 160 - Math.cos(rad) * length;

          return (
            <g key={i}>
              {/* Feather stem */}
              <motion.line
                x1="100" y1="160"
                x2={ex} y2={ey}
                stroke={FEATHER_COLORS[i]}
                strokeWidth="1.5"
                strokeOpacity="0.8"
                initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : {}}
                animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              />
              {/* Feather eye (teardrop) */}
              <motion.ellipse
                cx={ex}
                cy={ey}
                rx="7"
                ry="11"
                fill={FEATHER_COLORS[i]}
                fillOpacity="0.7"
                transform={`rotate(${angle} ${ex} ${ey})`}
                initial={shouldAnimate ? { scale: 0, opacity: 0 } : {}}
                animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05, ease: 'backOut' }}
                style={{ originX: `${ex}px`, originY: `${ey}px` }}
              />
              {/* Iridescent eye center */}
              <motion.ellipse
                cx={ex}
                cy={ey}
                rx="4"
                ry="6"
                fill={EYE_COLORS[i]}
                fillOpacity="0.9"
                transform={`rotate(${angle} ${ex} ${ey})`}
                initial={shouldAnimate ? { scale: 0, opacity: 0 } : {}}
                animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.45 + i * 0.05, ease: 'backOut' }}
                style={{ originX: `${ex}px`, originY: `${ey}px` }}
              />
            </g>
          );
        })}

        {/* Peacock body */}
        <motion.ellipse
          cx="100" cy="158"
          rx="16" ry="22"
          fill="#006994"
          fillOpacity="0.9"
          initial={shouldAnimate ? { scale: 0 } : {}}
          animate={shouldAnimate ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.7, ease: 'backOut' }}
          style={{ originX: '100px', originY: '158px' }}
        />

        {/* Neck */}
        <motion.path
          d="M100,140 C97,130 98,122 100,115 C102,122 103,130 100,140"
          fill="#008080"
          initial={shouldAnimate ? { opacity: 0 } : {}}
          animate={shouldAnimate ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.8 }}
        />

        {/* Head */}
        <motion.circle
          cx="100" cy="110"
          r="10"
          fill="#006994"
          initial={shouldAnimate ? { scale: 0 } : {}}
          animate={shouldAnimate ? { scale: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.85, ease: 'backOut' }}
          style={{ originX: '100px', originY: '110px' }}
        />

        {/* Crest */}
        {[0, -15, 15].map((offset, i) => (
          <motion.ellipse
            key={i}
            cx={100 + offset}
            cy={95}
            rx="2" ry="6"
            fill={i === 0 ? '#E08000' : '#C9933A'}
            initial={shouldAnimate ? { scaleY: 0 } : {}}
            animate={shouldAnimate ? { scaleY: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.9 + i * 0.05, ease: 'backOut' }}
            style={{ originX: `${100 + offset}px`, originY: '95px' }}
          />
        ))}

        {/* Eye */}
        <circle cx="104" cy="108" r="2.5" fill="#FFF8E7" />
        <circle cx="104.5" cy="108" r="1.5" fill="#1A0D00" />
      </svg>
    </div>
  );
}
