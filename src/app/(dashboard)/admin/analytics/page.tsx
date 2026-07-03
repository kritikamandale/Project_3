'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CalendarDays, ShoppingBag, TrendingUp, Wallet, Activity } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  totalUsers:    number;
  totalHosts:    number;
  totalVendors:  number;
  totalEvents:   number;
  activeEvents:  number;
  totalGuests:   number;
  totalBudget:   number;
  totalSpent:    number;
  newUsersThisMonth: number;
  newEventsThisMonth: number;
}

interface EventTypeCount { eventType: string; count: number; }
interface StatusCount    { status:    string; count: number; }

// ─── SVG Chart helpers ────────────────────────────────────────────────────────

function DonutChart({
  segments,
  total,
  size = 140,
  strokeWidth = 22,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r     = (size - strokeWidth) / 2;
  const cx    = size / 2;
  const cy    = size / 2;
  const circ  = 2 * Math.PI * r;
  let cumulative = 0;

  const slices = segments.map((seg) => {
    const len    = total > 0 ? (seg.value / total) * circ : 0;
    const offset = cumulative;
    cumulative  += len;
    return { ...seg, len, offset };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-[var(--muted)]" />
      {slices.map((s, i) =>
        s.value > 0 ? (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.len} ${circ}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ) : null
      )}
    </svg>
  );
}

function HBar({ value, max, color, label, sublabel }: { value: number; max: number; color: string; label: string; sublabel?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-right">
        <p className="text-xs font-medium text-[var(--foreground)] truncate">{label}</p>
        {sublabel && <p className="text-xs text-[var(--muted-fg)]">{sublabel}</p>}
      </div>
      <div className="flex-1 h-6 bg-[var(--muted)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full flex items-center justify-end pr-2"
          style={{ background: color }}
        >
          {pct > 15 && <span className="text-xs text-white font-medium">{value}</span>}
        </motion.div>
      </div>
      {pct <= 15 && <span className="text-xs text-[var(--muted-fg)] shrink-0">{value}</span>}
    </div>
  );
}

function formatCurrency(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

// ─── Status palette ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:     '#C9933A',
  published: '#3B82F6',
  ongoing:   '#22C55E',
  completed: '#A855F7',
  cancelled: '#EF4444',
};

const TYPE_COLORS = [
  '#C9933A','#E8C06B','#3B82F6','#22C55E','#A855F7',
  '#EF4444','#F59E0B','#10B981','#6366F1','#EC4899',
  '#8B5CF6','#14B8A6','#F97316','#06B6D4','#84CC16','#64748B',
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [stats,       setStats]       = useState<PlatformStats | null>(null);
  const [byType,      setByType]      = useState<EventTypeCount[]>([]);
  const [byStatus,    setByStatus]    = useState<StatusCount[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()).catch(() => ({})),
      fetch('/api/admin/events?limit=200').then((r) => r.json()).catch(() => ({ events: [] })),
      fetch('/api/admin/users?limit=1').then((r) => r.json()).catch(() => ({})),
    ]).then(([statsData, eventsData]) => {
      if (statsData?.stats) setStats(statsData.stats);

      // Derive type and status distributions from events
      const evList: { eventType: string; status: string }[] = Array.isArray(eventsData?.events) ? eventsData.events : [];

      const typeCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      evList.forEach((e) => {
        typeCounts[e.eventType]  = (typeCounts[e.eventType]  ?? 0) + 1;
        statusCounts[e.status]   = (statusCounts[e.status]   ?? 0) + 1;
      });

      setByType(
        Object.entries(typeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([eventType, count]) => ({ eventType, count }))
      );
      setByStatus(
        Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
      );
    }).finally(() => setLoading(false));
  }, []);

  const totalEvents = byStatus.reduce((s, b) => s + b.count, 0);
  const maxType     = byType[0]?.count ?? 1;

  const statusSegments = byStatus
    .filter((b) => b.count > 0)
    .map((b) => ({ label: b.status, value: b.count, color: STATUS_COLORS[b.status] ?? '#999' }));

  const typeSegments = byType
    .slice(0, 8)
    .map((b, i) => {
      const meta = EVENT_TYPES.find((t) => t.value === b.eventType);
      return { label: meta?.label ?? b.eventType, value: b.count, color: TYPE_COLORS[i] ?? '#ccc' };
    });

  const topTypesTotal = typeSegments.reduce((s, t) => s + t.value, 0);

  const kpiCards = [
    { label: 'Total Users',    value: stats?.totalUsers    ?? '—', icon: Users,        color: 'text-blue-600',  bg: 'bg-blue-50',    trend: stats?.newUsersThisMonth != null ? `+${stats.newUsersThisMonth} this month` : undefined },
    { label: 'Total Events',   value: stats?.totalEvents   ?? '—', icon: CalendarDays, color: 'text-[var(--pichwai-gold)]', bg: 'bg-[rgba(201,147,58,0.1)]', trend: stats?.newEventsThisMonth != null ? `+${stats.newEventsThisMonth} this month` : undefined },
    { label: 'Active Events',  value: stats?.activeEvents  ?? '—', icon: Activity,     color: 'text-green-600', bg: 'bg-green-50',   trend: undefined },
    { label: 'Total Vendors',  value: stats?.totalVendors  ?? '—', icon: ShoppingBag,  color: 'text-purple-600',bg: 'bg-purple-50',  trend: undefined },
    { label: 'Total Guests',   value: stats?.totalGuests   ?? '—', icon: Users,        color: 'text-orange-500',bg: 'bg-orange-50',  trend: undefined },
    { label: 'Budget on Platform', value: stats?.totalBudget != null ? formatCurrency(stats.totalBudget) : '—', icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50', trend: stats?.totalSpent != null ? `${formatCurrency(stats.totalSpent)} spent` : undefined },
    { label: 'Hosts',          value: stats?.totalHosts    ?? '—', icon: TrendingUp,   color: 'text-indigo-600',bg: 'bg-indigo-50',  trend: undefined },
    { label: 'Platform Activity', value: loading ? '—' : `${totalEvents}`, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'events tracked' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Analytics</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">Platform-wide insights and metrics.</p>
      </motion.div>

      {/* KPI Grid */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.slice(0, 4).map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${c.bg} ${c.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-[var(--muted-fg)]">{c.label}</p>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : c.value}</p>
              {c.trend && <p className="text-xs text-green-600 mt-1">{c.trend}</p>}
            </div>
          );
        })}
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.slice(4).map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${c.bg} ${c.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-[var(--muted-fg)]">{c.label}</p>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : c.value}</p>
              {c.trend && <p className="text-xs text-[var(--muted-fg)] mt-1">{c.trend}</p>}
            </div>
          );
        })}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Events by Status — Donut */}
        <motion.div {...fadeUp(0.12)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-6">Events by Status</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--border-gold)] border-t-[var(--pichwai-gold)] animate-spin" />
            </div>
          ) : statusSegments.length === 0 ? (
            <p className="text-center text-[var(--muted-fg)] py-10">No data yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="relative shrink-0">
                <DonutChart segments={statusSegments} total={totalEvents} size={140} strokeWidth={22} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--pichwai-gold-deep)]">{totalEvents}</span>
                  <span className="text-xs text-[var(--muted-fg)]">total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {statusSegments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-sm capitalize text-[var(--foreground)]">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{s.value}</span>
                      <span className="text-xs text-[var(--muted-fg)]">{totalEvents > 0 ? Math.round((s.value / totalEvents) * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Events by Type — Donut */}
        <motion.div {...fadeUp(0.14)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-6">Events by Type</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--border-gold)] border-t-[var(--pichwai-gold)] animate-spin" />
            </div>
          ) : typeSegments.length === 0 ? (
            <p className="text-center text-[var(--muted-fg)] py-10">No data yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <DonutChart segments={typeSegments} total={topTypesTotal} size={140} strokeWidth={22} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--pichwai-gold-deep)]">{byType.length}</span>
                  <span className="text-xs text-[var(--muted-fg)]">types</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {typeSegments.slice(0, 6).map((s, i) => {
                  const meta = EVENT_TYPES.find((t) => t.label === s.label);
                  return (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{meta?.icon ?? '📅'}</span>
                        <span className="text-xs text-[var(--foreground)] truncate max-w-[100px]">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--pichwai-gold-deep)]">{s.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Event Types horizontal bars */}
      <motion.div {...fadeUp(0.18)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-6">Top Event Types</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-[var(--muted)] rounded-full animate-pulse" />
            ))}
          </div>
        ) : byType.length === 0 ? (
          <p className="text-center text-[var(--muted-fg)] py-8">No events yet.</p>
        ) : (
          <div className="space-y-3">
            {byType.slice(0, 10).map((b, i) => {
              const meta  = EVENT_TYPES.find((t) => t.value === b.eventType);
              return (
                <HBar
                  key={b.eventType}
                  value={b.count}
                  max={maxType}
                  color={TYPE_COLORS[i] ?? '#C9933A'}
                  label={`${meta?.icon ?? '📅'} ${meta?.label ?? b.eventType}`}
                  sublabel={`${totalEvents > 0 ? Math.round((b.count / totalEvents) * 100) : 0}% of events`}
                />
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Budget insights */}
      {stats && (
        <motion.div {...fadeUp(0.22)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-6">Budget Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Budget Planned', value: formatCurrency(stats.totalBudget ?? 0), color: '#C9933A', pct: 100 },
              { label: 'Total Spent',          value: formatCurrency(stats.totalSpent  ?? 0), color: '#3B82F6', pct: stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0 },
              { label: 'Remaining',            value: formatCurrency(Math.max(0, (stats.totalBudget ?? 0) - (stats.totalSpent ?? 0))), color: '#22C55E', pct: stats.totalBudget > 0 ? Math.round(((stats.totalBudget - stats.totalSpent) / stats.totalBudget) * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-[var(--muted-fg)] mb-1">{item.label}</p>
                <p className="text-xl font-bold mb-2" style={{ color: item.color }}>{item.value}</p>
                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                  />
                </div>
                <p className="text-xs text-[var(--muted-fg)] mt-1">{item.pct}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* User breakdown */}
      {stats && (
        <motion.div {...fadeUp(0.26)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-6">User Breakdown</h2>
          <div className="flex items-center gap-8">
            <div className="relative shrink-0">
              <DonutChart
                segments={[
                  { label: 'Hosts',   value: stats.totalHosts ?? 0,   color: '#C9933A' },
                  { label: 'Vendors', value: stats.totalVendors ?? 0, color: '#3B82F6' },
                  { label: 'Others',  value: Math.max(0, (stats.totalUsers ?? 0) - (stats.totalHosts ?? 0) - (stats.totalVendors ?? 0)), color: '#E8C06B' },
                ].filter((s) => s.value > 0)}
                total={stats.totalUsers ?? 0}
                size={120}
                strokeWidth={18}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[var(--pichwai-gold-deep)]">{stats.totalUsers ?? 0}</span>
                <span className="text-xs text-[var(--muted-fg)]">users</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: 'Hosts',   value: stats.totalHosts ?? 0,   color: '#C9933A', icon: '🎪' },
                { label: 'Vendors', value: stats.totalVendors ?? 0, color: '#3B82F6', icon: '🏪' },
                { label: 'Others',  value: Math.max(0, (stats.totalUsers ?? 0) - (stats.totalHosts ?? 0) - (stats.totalVendors ?? 0)), color: '#E8C06B', icon: '👤' },
              ].map((u) => (
                <div key={u.label} className="flex items-center gap-3">
                  <span>{u.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--foreground)]">{u.label}</span>
                      <span className="font-semibold" style={{ color: u.color }}>{u.value}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.totalUsers > 0 ? (u.value / stats.totalUsers) * 100 : 0}%`, background: u.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
