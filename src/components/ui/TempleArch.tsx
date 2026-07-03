import React from 'react';

interface TempleArchProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'open' | 'closed' | 'tall-closed';
}

export function TempleArch({ children, className = '', variant = 'open' }: TempleArchProps) {
  const isClosed = variant === 'closed';
  const isTallClosed = variant === 'tall-closed';
  
  // Wider path for the symmetrical Temple Gopuram Arch
  const archPath = `
    M 500 60
    C 570 60, 690 100, 710 150
    L 750 150
    L 760 180
    L 810 180
    L 830 220
    C 840 240, 930 270, 930 300
    ${isClosed ? 'L 930 950 L 70 950' : isTallClosed ? 'L 930 1100 L 70 1100' : 'L 930 2050 L 70 2050'}
    L 70 300
    C 70 270, 160 240, 170 220
    L 190 180
    L 240 180
    L 250 150
    L 290 150
    C 310 100, 430 60, 500 60
    Z
  `.trim();

  return (
    <div 
      className={`relative flex flex-col items-center justify-start w-full mx-auto ${isClosed ? 'max-w-4xl aspect-[10/10]' : isTallClosed ? 'max-w-4xl aspect-[10/11]' : 'max-w-6xl'} ${className}`}
    >
      {/* Background SVGs Wrapper */}
      <div className="absolute inset-0 pointer-events-none drop-shadow-2xl z-0 overflow-hidden">


        {/* Background SVG Frame (Top Arch) */}
        <svg
          className={`absolute top-0 left-0 w-full ${isClosed || isTallClosed ? 'h-full' : ''}`}
          viewBox={isClosed ? "0 0 1000 1000" : isTallClosed ? "0 0 1000 1100" : "0 0 1000 2000"}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio={isClosed || isTallClosed ? "xMidYMid meet" : "xMidYMin meet"}
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e8cf9c" />
              <stop offset="50%" stopColor="#cda45e" />
              <stop offset="100%" stopColor="#a67c3d" />
            </linearGradient>
            
            <linearGradient id="goldGradientAlt" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#e8cf9c" />
              <stop offset="50%" stopColor="#cda45e" />
              <stop offset="100%" stopColor="#a67c3d" />
            </linearGradient>

            {/* Deep Maroon Interior */}
            <linearGradient id="maroonFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3d0f1a" />
              <stop offset="100%" stopColor="#2a0810" />
            </linearGradient>

            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          <g filter="url(#softShadow)">
            {/* Main Solid Shape + Outer Gold Line */}
            <path
              d={archPath}
              fill="#2a0810"
              stroke="url(#goldGradient)"
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* Background Gap (creates the double line effect by erasing the middle of the thick stroke) */}
            <path
              d={archPath}
              fill="none"
              stroke="transparent" /* Matches background gradient exactly */
              strokeWidth="4.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* Inner Gold Line */}
            <path
              d={archPath}
              fill="none"
              stroke="url(#goldGradientAlt)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>

          {/* Finial (Top Dot) */}
          {/* Connection line */}
          <path d="M 500 40 L 500 60" stroke="url(#goldGradient)" strokeWidth="3" />
          {/* Dot */}
          <circle cx="500" cy="35" r="7" fill="url(#goldGradient)" />
          {/* Inner dot highlight */}
          <circle cx="498" cy="33" r="2" fill="#e8cf9c" />
          
        </svg>

        {/* Bottom Extension & Border to dynamically "close" the open arch at its container bounds */}
        {!isClosed && !isTallClosed && (
          <div className="absolute bottom-0 left-[6.65%] right-[6.65%] h-[7px] bg-gradient-to-r from-[#e8cf9c] via-[#cda45e] to-[#a67c3d] z-10" />
        )}
      </div>

      {/* Content Container (Constrained inside the arch) */}
      <div className={`relative z-10 flex flex-col items-center justify-start w-full h-full px-8 sm:px-16 ${isClosed || isTallClosed ? 'pt-[34%] pb-12' : 'pt-[24%] pb-20'} text-center text-white`}>
        {children}
      </div>
    </div>
  );
}

export default TempleArch;
