'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays, Users, ShoppingBag, Wallet, Sparkles,
  BarChart3, Settings, LayoutDashboard, Briefcase,
  DollarSign, UserCheck, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth.types';

const HOST_NAV = [
  { label: 'Dashboard',  href: '/host/dashboard',   icon: LayoutDashboard },
  { label: 'Events',     href: '/host/events',       icon: CalendarDays },
  { label: 'Guests',     href: '/host/guests',       icon: Users },
  { label: 'Vendors',    href: '/host/vendors',      icon: ShoppingBag },
  { label: 'Budget',     href: '/host/budget',       icon: Wallet },
  { label: 'AI Assist',  href: '/host/ai-assistant', icon: Sparkles },
  { label: 'Settings',   href: '/host/settings',     icon: Settings },
] as const;

const VENDOR_NAV = [
  { label: 'Dashboard',  href: '/vendor/dashboard', icon: LayoutDashboard },
  { label: 'Bookings',   href: '/vendor/bookings',  icon: Briefcase },
  { label: 'Earnings',   href: '/vendor/earnings',  icon: DollarSign },
  { label: 'Profile',    href: '/vendor/profile',   icon: UserCheck },
  { label: 'Settings',   href: '/vendor/settings',  icon: Settings },
] as const;

const ADMIN_NAV = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icon: LayoutDashboard },
  { label: 'Users',      href: '/admin/users',       icon: Users },
  { label: 'Events',     href: '/admin/events',      icon: CalendarDays },
  { label: 'Vendors',    href: '/admin/vendors',     icon: ShoppingBag },
  { label: 'Analytics',  href: '/admin/analytics',   icon: BarChart3 },
] as const;

function navForRole(role: UserRole | undefined, pathname: string) {
  if (role === 'vendor' || pathname.startsWith('/vendor'))      return VENDOR_NAV;
  if (role === 'super_admin' || pathname.startsWith('/admin')) return ADMIN_NAV;
  return HOST_NAV;
}

interface SidebarProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function Sidebar({ onClose, isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = navForRole(user?.role, pathname);

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-64 bg-[var(--card-bg)] border-r border-[var(--border-gold)]',
        'transition-transform duration-300 ease-in-out'
      )}
    >
      {/* Brand header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--border-gold)] shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <ellipse key={i} cx="16" cy="8" rx="3" ry="8"
                fill={i % 2 === 0 ? '#C9933A' : '#E8C06B'}
                transform={`rotate(${deg} 16 16)`} />
            ))}
            <circle cx="16" cy="16" r="4" fill="#E8C06B" />
          </svg>
          <span className="font-cinzel text-base font-bold gold-text-spec">Milap</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-[var(--muted)] transition-colors" aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* User info strip */}
      {user && (
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[rgba(201,147,58,0.04)] shrink-0">
          <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user.name}</p>
          <p className="text-caption text-[var(--muted-fg)] capitalize">
            {user.role === 'super_admin' ? 'Admin' : user.role}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item) => {
          const Icon   = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-[rgba(201,147,58,0.15)] to-[rgba(201,147,58,0.05)] text-[var(--pichwai-gold-deep)] border-l-2 border-[var(--pichwai-gold)]'
                  : 'text-[var(--pichwai-mid-brown)] hover:bg-[rgba(201,147,58,0.06)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 shrink-0', active ? 'text-[var(--pichwai-gold)]' : 'text-[var(--muted-fg)]')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom gold ornament */}
      <div className="px-5 py-4 border-t border-[var(--border)] shrink-0">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(201,147,58,0.4)] to-transparent" />
      </div>
    </aside>
  );
}
