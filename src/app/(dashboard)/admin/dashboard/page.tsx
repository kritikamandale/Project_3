'use client';

import { useEffect, useState } from 'react';
import { Users, CalendarDays, ShoppingBag, TrendingUp, Activity } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalVendors: number;
  activeEvents: number;
}

interface RecentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats]       = useState<AdminStats>({ totalUsers: 0, totalEvents: 0, totalVendors: 0, activeEvents: 0 });
  const [recentUsers, setRecent] = useState<RecentUser[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()).catch(() => ({})),
      fetch('/api/admin/users?limit=5&sortOrder=desc').then((r) => r.json()).catch(() => ({})),
    ]).then(([statsData, usersData]) => {
      if (statsData?.stats) setStats(statsData.stats);
      if (Array.isArray(usersData?.users)) setRecent(usersData.users);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users',    value: stats.totalUsers,   icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Total Events',   value: stats.totalEvents,  icon: CalendarDays, color: 'text-[var(--pichwai-gold)]', bg: 'bg-[rgba(201,147,58,0.1)]' },
    { label: 'Vendors',        value: stats.totalVendors, icon: ShoppingBag,  color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Active Events',  value: stats.activeEvents, icon: Activity,     color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const ROLE_STYLES: Record<string, string> = {
    host:        'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
    vendor:      'bg-blue-50 text-blue-700',
    super_admin: 'bg-purple-50 text-purple-700',
    guest:       'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Admin Dashboard</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">Platform overview and quick actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className={`${s.bg} ${s.color} p-2.5 rounded-lg shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--foreground)]">{loading ? '—' : s.value.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-fg)]">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users',   label: 'Manage Users',   icon: '👥' },
          { href: '/admin/events',  label: 'All Events',      icon: '📅' },
          { href: '/admin/vendors', label: 'Verify Vendors',  icon: '🏪' },
          { href: '/admin/analytics',label: 'Analytics',      icon: '📊' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 text-center hover:border-[var(--pichwai-gold)] hover:shadow-md transition-all group"
          >
            <span className="text-3xl block mb-2">{link.icon}</span>
            <span className="text-xs font-medium text-[var(--pichwai-mid-brown)] group-hover:text-[var(--pichwai-gold-deep)] transition-colors">{link.label}</span>
          </a>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--pichwai-gold)]" />
            Recent Signups
          </h2>
          <a href="/admin/users" className="text-sm text-[var(--pichwai-gold-deep)] hover:underline">View all</a>
        </div>

        {loading ? (
          <div className="p-6 text-center text-[var(--muted-fg)] text-sm">Loading…</div>
        ) : recentUsers.length === 0 ? (
          <div className="p-10 text-center text-[var(--muted-fg)] text-sm">No users yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-6 py-3 hover:bg-[rgba(201,147,58,0.03)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9933A] to-[#E8C06B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {u.fullName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{u.fullName}</p>
                    <p className="text-xs text-[var(--muted-fg)]">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[u.role] ?? ROLE_STYLES.guest}`}>
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
