import Link from 'next/link';
import { PichwaiDivider } from '@/components/pichwai/PichwaiDivider';

const LINKS = {
  Product: [
    { label: 'Features',   href: '/about' },
    { label: 'Pricing',    href: '/pricing' },
    { label: 'Vendors',    href: '/vendors' },
    { label: 'For Hosts',  href: '/register' },
  ],
  Company: [
    { label: 'About Us',   href: '/about' },
    { label: 'Contact',    href: '/contact' },
    { label: 'Blog',       href: '/blog' },
    { label: 'Careers',    href: '/careers' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use',   href: '/terms' },
    { label: 'Refund Policy',  href: '/refunds' },
  ],
} as const;

export function Footer() {
  return (
    <footer className="bg-[#1A0D00] text-[var(--pichwai-cream)] border-t border-[rgba(201,147,58,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                  <ellipse key={i} cx="16" cy="8" rx="3" ry="8"
                    fill={i % 2 === 0 ? '#C9933A' : '#E8C06B'}
                    transform={`rotate(${deg} 16 16)`} />
                ))}
                <circle cx="16" cy="16" r="4" fill="#E8C06B" />
              </svg>
              <span className="font-cinzel text-xl font-bold gold-text-spec">Milap</span>
            </div>
            <p className="text-small text-[rgba(255,248,231,0.6)] leading-relaxed max-w-xs">
              India&apos;s most beautiful event management platform. Rooted in tradition,
              powered by technology.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Instagram', icon: '📸', href: '#' },
                { label: 'WhatsApp',  icon: '💬', href: '#' },
                { label: 'YouTube',   icon: '▶️',  href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-[rgba(201,147,58,0.3)] flex items-center justify-center text-sm hover:border-[rgba(201,147,58,0.7)] hover:bg-[rgba(201,147,58,0.08)] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, readonly { label: string; href: string }[]][]).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-small text-[rgba(255,248,231,0.6)] hover:text-[var(--pichwai-gold-light)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <PichwaiDivider variant="gold" size="lg" className="opacity-20 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-[rgba(255,248,231,0.4)]">
          <p>© {new Date().getFullYear()} Milap. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-[var(--pichwai-lotus)]">❤️</span> for India
          </p>
        </div>
      </div>
    </footer>
  );
}
