'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, LogOut, Settings, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  onMenuOpen?: () => void;
}

interface NotifItem {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/notifications?limit=10')
      .then((r) => r.json())
      .then((d) => setNotifs(Array.isArray(d?.notifications) ? d.notifications : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function iconFor(type: string) {
    if (type === 'error' || type === 'payment')   return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    if (type === 'warning' || type === 'reminder') return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
    if (type === 'rsvp_update' || type === 'booking') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    return <Info className="h-3.5 w-3.5 text-blue-500" />;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-[var(--foreground)]" />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--pichwai-saffron)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm text-[var(--pichwai-mid-brown)]">
              Notifications
              {unread > 0 && <span className="text-xs text-red-500 font-bold ml-1.5">{unread} new</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="text-[var(--muted-fg)] hover:text-[var(--foreground)] transition p-1 rounded hover:bg-[var(--muted)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-[var(--muted-fg)]">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-[var(--pichwai-gold)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--muted-fg)]">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[rgba(201,147,58,0.04)] transition ${!n.isRead ? 'bg-[rgba(201,147,58,0.03)]' : ''}`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-[var(--muted)]">
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)] leading-snug">{n.title}</p>
                    <p className="text-xs text-[var(--muted-fg)] mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-[var(--muted-fg)] mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-[var(--pichwai-gold)] shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[rgba(201,147,58,0.03)]">
            <Link
              href="/host/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--pichwai-gold-deep)] hover:underline"
            >
              Notification settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Navbar ─────────────────────────────────────────────────────────

export function DashboardNavbar({ onMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const settingsHref = user?.role === 'super_admin' ? '/admin/dashboard' : '/host/settings';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border-gold)] bg-[var(--card-bg)]">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5 text-[var(--foreground)]" />
          </button>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-[var(--muted)] transition-all"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8 ring-2 ring-[var(--border-gold)]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#C9933A] to-[#E8C06B] text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[var(--foreground)] leading-none">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-[var(--muted-fg)] capitalize leading-none mt-0.5">
                    {user?.role === 'super_admin' ? 'Admin' : user?.role}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#C9933A] to-[#E8C06B] text-white text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-[var(--muted-fg)] font-normal truncate max-w-[160px]">{user?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={settingsHref} className="flex items-center gap-2">
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

        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Home',    href: '/' },
            { label: 'Vendors', href: '/vendors' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'About',   href: '/about' },
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
