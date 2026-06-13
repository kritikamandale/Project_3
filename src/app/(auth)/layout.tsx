import Link from 'next/link';
import { PichwaiHeroBg } from '@/components/pichwai/PichwaiBackground';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <PichwaiHeroBg className="fixed" />

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2 mb-8">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <ellipse key={i} cx="16" cy="8" rx="3" ry="8"
              fill={i % 2 === 0 ? '#C9933A' : '#E8C06B'}
              transform={`rotate(${deg} 16 16)`} />
          ))}
          <circle cx="16" cy="16" r="4" fill="#E8C06B" />
        </svg>
        <span className="font-cinzel text-2xl font-bold gold-text-spec">EventNest</span>
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--card-bg)] border border-[var(--border-gold)] shadow-[var(--shadow-pichwai)] p-8">
        {children}
      </div>

      <p className="relative z-10 mt-6 text-caption text-[var(--muted-fg)]">
        © {new Date().getFullYear()} EventNest
      </p>
    </div>
  );
}
