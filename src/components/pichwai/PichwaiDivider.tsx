import { cn } from '@/lib/utils/cn';

interface PichwaiDividerProps {
  variant?: 'gold' | 'indigo' | 'saffron';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = {
  gold:    { main: '#C9933A', mid: '#E8C06B', dark: '#8B621A' },
  indigo:  { main: '#3D4FFF', mid: '#8D96FF', dark: '#1A2799' },
  saffron: { main: '#E08000', mid: '#FFC330', dark: '#B35E00' },
} as const;

const SIZES = {
  sm: { width: 320, height: 32 },
  md: { width: 480, height: 40 },
  lg: { width: 640, height: 48 },
} as const;

export function PichwaiDivider({
  variant = 'gold',
  size    = 'md',
  className,
}: PichwaiDividerProps) {
  const c = COLORS[variant];
  const { width, height } = SIZES[size];
  const cx = width / 2;
  const cy = height / 2;

  return (
    <div className={cn('flex items-center justify-center w-full', className)} aria-hidden="true">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full"
      >
        <defs>
          <linearGradient id={`divider-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={c.dark} stopOpacity="0" />
            <stop offset="30%"  stopColor={c.main} stopOpacity="0.6" />
            <stop offset="50%"  stopColor={c.mid}  stopOpacity="0.9" />
            <stop offset="70%"  stopColor={c.main} stopOpacity="0.6" />
            <stop offset="100%" stopColor={c.dark} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main line */}
        <line
          x1="0" y1={cy} x2={width} y2={cy}
          stroke={`url(#divider-grad-${variant})`}
          strokeWidth="1"
        />

        {/* Left vine */}
        <path
          d={`M${cx - 60},${cy} C${cx - 80},${cy - 8} ${cx - 100},${cy + 6} ${cx - 120},${cy - 2} C${cx - 140},${cy - 8} ${cx - 155},${cy + 4} ${cx - 170},${cy}`}
          stroke={c.main}
          strokeWidth="1.2"
          strokeOpacity="0.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right vine */}
        <path
          d={`M${cx + 60},${cy} C${cx + 80},${cy - 8} ${cx + 100},${cy + 6} ${cx + 120},${cy - 2} C${cx + 140},${cy - 8} ${cx + 155},${cy + 4} ${cx + 170},${cy}`}
          stroke={c.main}
          strokeWidth="1.2"
          strokeOpacity="0.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Left small leaf nodes */}
        {[0.3, 0.52, 0.72].map((t, i) => {
          const lx = cx - 60 - t * 110;
          const ly = cy + (i % 2 === 0 ? -6 : 6);
          return (
            <ellipse
              key={`ll-${i}`}
              cx={lx} cy={ly}
              rx="5" ry="3"
              fill={c.main}
              fillOpacity="0.35"
              transform={`rotate(${i % 2 === 0 ? -20 : 20} ${lx} ${ly})`}
            />
          );
        })}
        {/* Right small leaf nodes */}
        {[0.3, 0.52, 0.72].map((t, i) => {
          const lx = cx + 60 + t * 110;
          const ly = cy + (i % 2 === 0 ? -6 : 6);
          return (
            <ellipse
              key={`rl-${i}`}
              cx={lx} cy={ly}
              rx="5" ry="3"
              fill={c.main}
              fillOpacity="0.35"
              transform={`rotate(${i % 2 === 0 ? 20 : -20} ${lx} ${ly})`}
            />
          );
        })}

        {/* Central lotus */}
        <g transform={`translate(${cx},${cy})`}>
          {/* 8 petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <ellipse
              key={`p-${i}`}
              cx="0" cy="-11"
              rx="3.5" ry="8"
              fill={i % 2 === 0 ? c.mid : c.main}
              fillOpacity="0.85"
              transform={`rotate(${deg})`}
            />
          ))}
          {/* Center circle */}
          <circle cx="0" cy="0" r="5" fill={c.mid} />
          <circle cx="0" cy="0" r="3" fill={c.dark} />
        </g>

        {/* Left dot accent */}
        <circle cx={cx - 45} cy={cy} r="2.5" fill={c.main} fillOpacity="0.7" />
        <circle cx={cx - 55} cy={cy} r="1.5" fill={c.main} fillOpacity="0.4" />
        {/* Right dot accent */}
        <circle cx={cx + 45} cy={cy} r="2.5" fill={c.main} fillOpacity="0.7" />
        <circle cx={cx + 55} cy={cy} r="1.5" fill={c.main} fillOpacity="0.4" />
      </svg>
    </div>
  );
}
