'use client';

import Link from 'next/link';
import { Bell, Menu, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  onMenuOpen?: () => void;
}

export function DashboardNavbar({ onMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border-gold)] bg-[var(--card-bg)] backdrop-blur-sm pichwai-glass">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger (mobile) + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-[var(--radius-sm)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5 text-[var(--foreground)]" />
          </button>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button
            className="relative p-2 rounded-[var(--radius-sm)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-[var(--foreground)]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--pichwai-saffron)]" aria-hidden="true" />
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[var(--border-gold)] transition-all" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm">{user?.name}</span>
                  <span className="text-xs text-[var(--muted-fg)] font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/host/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--pichwai-ruby)] focus:text-[var(--pichwai-ruby)] focus:bg-[rgba(198,40,40,0.06)]"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// ─── Public marketing navbar ───────────────────────────────────────────────────

export function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[rgba(201,147,58,0.2)] bg-[rgba(255,248,231,0.85)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <ellipse key={i} cx="16" cy="8" rx="3" ry="8"
                fill={i % 2 === 0 ? '#C9933A' : '#E8C06B'}
                transform={`rotate(${deg} 16 16)`} />
            ))}
            <circle cx="16" cy="16" r="4" fill="#E8C06B" />
          </svg>
          <span className="font-cinzel text-lg font-bold gold-text-spec">EventNest</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Vendors',  href: '/vendors' },
            { label: 'Pricing',  href: '/pricing' },
            { label: 'About',    href: '/about' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-small text-[var(--pichwai-mid-brown)] hover:text-[var(--pichwai-gold-deep)] font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-small font-medium text-[var(--pichwai-mid-brown)] hover:text-[var(--pichwai-gold-deep)] transition-colors hidden sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-[#3E2000] hover:from-[#B8860B] hover:to-[#C9933A] shadow-sm transition-all active:scale-[0.97]"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
