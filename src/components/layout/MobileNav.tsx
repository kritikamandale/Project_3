'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays, Users, ShoppingBag, Sparkles, LayoutDashboard,
  Briefcase, DollarSign, UserCheck, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth.types';

const HOST_BOTTOM = [
  { label: 'Home',     href: '/host/dashboard',   icon: LayoutDashboard },
  { label: 'Events',   href: '/host/events',       icon: CalendarDays },
  { label: 'Guests',   href: '/host/guests',       icon: Users },
  { label: 'Vendors',  href: '/host/vendors',      icon: ShoppingBag },
  { label: 'AI',       href: '/host/ai-assistant', icon: Sparkles },
] as const;

const VENDOR_BOTTOM = [
  { label: 'Home',     href: '/vendor/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', href: '/vendor/bookings',  icon: Briefcase },
  { label: 'Earnings', href: '/vendor/earnings',  icon: DollarSign },
  { label: 'Profile',  href: '/vendor/profile',   icon: UserCheck },
] as const;

const ADMIN_BOTTOM = [
  { label: 'Home',     href: '/admin/dashboard',  icon: LayoutDashboard },
  { label: 'Users',    href: '/admin/users',       icon: Users },
  { label: 'Events',   href: '/admin/events',      icon: CalendarDays },
  { label: 'Analytics',href: '/admin/analytics',   icon: BarChart3 },
] as const;

function navForRole(role: UserRole | undefined, pathname: string) {
  if (role === 'vendor' || pathname.startsWith('/vendor'))      return VENDOR_BOTTOM;
  if (role === 'super_admin' || pathname.startsWith('/admin')) return ADMIN_BOTTOM;
  return HOST_BOTTOM;
}

export function MobileNav() {
  const pathname = usePathname();
  const { user }  = useAuth();
  const nav = navForRole(user?.role, pathname);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--card-bg)] border-t border-[var(--border-gold)] safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {nav.map((item) => {
          const Icon   = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--radius-sm)] transition-all min-w-[52px]',
                active
                  ? 'text-[var(--pichwai-gold-deep)]'
                  : 'text-[var(--muted-fg)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-[var(--pichwai-gold)]')} />
              <span className={cn('text-[10px] font-medium', active && 'text-[var(--pichwai-gold-deep)]')}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-t-full bg-[var(--pichwai-gold)]" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
