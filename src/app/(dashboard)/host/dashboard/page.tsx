'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, ArrowRight, CalendarDays, Users, Wallet,
  TrendingUp, AlertTriangle, CheckCircle2, Info,
  Clock, Circle, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  eventType: string;
  status: string;
  eventDate: string;
  venueCity?: string;
  expectedGuests: number;
  confirmedGuests: number;
  totalBudget: string;
  spentBudget: string;
  checklist?: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  title: string;
  category?: string;
  dueDate?: string;
  completed: boolean;
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const r    = 38;
  const cx   = 50;
  const cy   = 50;
  const circ = 2 * Math.PI * r;

  let cumulative = 0;
  const slices = segments.map((seg) => {
    const len    = total > 0 ? (seg.value / total) * circ : 0;
    const offset = cumulative;
    cumulative  += len;
    return { ...seg, len, offset };
  });

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="14" className="stroke-[var(--muted)]" />
        {/* Segments */}
        {slices.map((s, i) =>
          s.value > 0 ? (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${s.len} ${circ}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ) : null
        )}
      </svg>
      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[var(--pichwai-gold-deep)]">{total}</span>
        <span className="text-xs text-[var(--muted-fg)]">events</span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft:     '#C9933A',
  published: '#3B82F6',
  ongoing:   '#22C55E',
  completed: '#A855F7',
  cancelled: '#EF4444',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskItem({ task, eventTitle, eventId }: { task: ChecklistItem; eventTitle: string; eventId: string }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="mt-0.5 shrink-0">
        {task.completed
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <Circle className={`h-4 w-4 ${isOverdue ? 'text-red-400' : 'text-[var(--muted-fg)] opacity-50'}`} />
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${task.completed ? 'line-through text-[var(--muted-fg)]' : 'text-[var(--foreground)]'}`}>
          {task.title}
        </p>
        <Link href={`/host/events/${eventId}`} className="text-xs text-[var(--pichwai-gold-deep)] hover:underline">
          {eventTitle}
        </Link>
      </div>
      {task.dueDate && (
        <span className={`text-xs shrink-0 ${isOverdue ? 'text-red-500 font-medium' : 'text-[var(--muted-fg)]'}`}>
          {isOverdue ? 'Overdue' : task.dueDate}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostDashboardPage() {
  const { user } = useAuth();
  const [events, setEvents]   = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events?limit=20&sortBy=eventDate&sortOrder=asc')
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d?.events) ? d.events : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today    = new Date().toISOString().split('T')[0];
  const upcoming = useMemo(
    () => events.filter((e) => e.eventDate >= today && e.status !== 'cancelled').slice(0, 6),
    [events, today]
  );

  // Today's tasks: checklist items from upcoming events, not done, due within 14 days
  const todayTasks = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 14);
    return events
      .flatMap((e) =>
        (e.checklist ?? [])
          .filter((t) => !t.completed && (!t.dueDate || new Date(t.dueDate) <= cutoff))
          .slice(0, 2)
          .map((t) => ({ task: t, eventTitle: e.title, eventId: e.id }))
      )
      .slice(0, 6);
  }, [events]);

  // Alerts: overdue tasks + events happening in 3 days
  const alerts = useMemo(() => {
    const items: { type: 'warning' | 'error' | 'info'; msg: string; href?: string }[] = [];
    events.forEach((e) => {
      const dl = daysLeft(e.eventDate);
      if (dl > 0 && dl <= 3 && e.status !== 'completed' && e.status !== 'cancelled') {
        items.push({ type: 'warning', msg: `"${e.title}" is in ${dl} day${dl > 1 ? 's' : ''}!`, href: `/host/events/${e.id}` });
      }
      (e.checklist ?? []).forEach((t) => {
        if (!t.completed && t.dueDate && new Date(t.dueDate) < new Date()) {
          items.push({ type: 'error', msg: `Overdue task: ${t.title} — ${e.title}`, href: `/host/events/${e.id}` });
        }
      });
    });
    return items.slice(0, 5);
  }, [events]);

  // Stats
  const totalBudget = events.reduce((s, e) => s + Number(e.totalBudget), 0);
  const totalSpent  = events.reduce((s, e) => s + Number(e.spentBudget), 0);
  const totalGuests = events.reduce((s, e) => s + e.expectedGuests, 0);

  // Donut segments
  const donutSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => { counts[e.status] = (counts[e.status] ?? 0) + 1; });
    return Object.entries(STATUS_COLORS)
      .map(([status, color]) => ({ label: status, value: counts[status] ?? 0, color }))
      .filter((s) => s.value > 0);
  }, [events]);

  const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">
            Namaste{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 🙏
          </h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/host/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Events',    value: loading ? '—' : events.length,                 icon: CalendarDays, color: 'text-[var(--pichwai-gold)]', bg: 'bg-[rgba(201,147,58,0.1)]' },
          { label: 'Upcoming',     value: loading ? '—' : upcoming.length,                icon: TrendingUp,   color: 'text-blue-500',              bg: 'bg-blue-50' },
          { label: 'Total Guests', value: loading ? '—' : totalGuests.toLocaleString(),   icon: Users,        color: 'text-green-600',             bg: 'bg-green-50' },
          { label: 'Budget Spent', value: loading ? '—' : formatCurrency(totalSpent),     icon: Wallet,       color: 'text-purple-600',            bg: 'bg-purple-50' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className={`${s.bg} ${s.color} p-2.5 rounded-lg shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--foreground)]">{s.value}</p>
                <p className="text-xs text-[var(--muted-fg)]">{s.label}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Three-column middle section ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* TODAY'S TASKS */}
        <motion.div {...fadeUp(0.1)} className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--pichwai-mid-brown)] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--pichwai-gold)]" />
              Pending Tasks
              {todayTasks.length > 0 && (
                <span className="text-xs bg-[rgba(201,147,58,0.15)] text-[var(--pichwai-gold-deep)] px-1.5 py-0.5 rounded-full font-bold">{todayTasks.length}</span>
              )}
            </h2>
            <Link href="/host/events" className="text-xs text-[var(--pichwai-gold-deep)] hover:underline">See All</Link>
          </div>
          <div className="px-5 py-1">
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--muted-fg)]">Loading…</div>
            ) : todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-[var(--muted-fg)]">All caught up!</p>
              </div>
            ) : (
              todayTasks.map(({ task, eventTitle, eventId }, i) => (
                <TaskItem key={`${eventId}-${task.id}-${i}`} task={task} eventTitle={eventTitle} eventId={eventId} />
              ))
            )}
          </div>
          {todayTasks.length > 0 && (
            <div className="px-5 py-3 border-t border-[var(--border)]">
              <button className="text-xs text-[var(--muted-fg)] hover:text-[var(--pichwai-gold-deep)] transition flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>
          )}
        </motion.div>

        {/* EVENTS DISTRIBUTION DONUT */}
        <motion.div {...fadeUp(0.12)} className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">Events Overview</h2>
            <Link href="/host/events" className="text-xs text-[var(--pichwai-gold-deep)] hover:underline">See All</Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-[var(--border-gold)] border-t-[var(--pichwai-gold)] animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--muted-fg)]">No events yet</div>
            ) : (
              <>
                <DonutChart segments={donutSegments} total={events.length} />
                <div className="mt-4 space-y-1.5">
                  {donutSegments.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="capitalize text-[var(--muted-fg)]">{s.label}</span>
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ALERTS */}
        <motion.div {...fadeUp(0.14)} className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--pichwai-mid-brown)] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--pichwai-gold)]" />
              Alerts
              {alerts.length > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{alerts.length}</span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--muted-fg)]">Loading…</div>
            ) : alerts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-[var(--muted-fg)]">No active alerts</p>
              </div>
            ) : (
              alerts.map((alert, i) => {
                const Icon = alert.type === 'error' ? AlertTriangle : alert.type === 'warning' ? AlertTriangle : Info;
                const color = alert.type === 'error' ? 'text-red-500 bg-red-50' : alert.type === 'warning' ? 'text-orange-500 bg-orange-50' : 'text-blue-500 bg-blue-50';
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-[rgba(201,147,58,0.03)] transition">
                    <div className={`p-1 rounded-full shrink-0 mt-0.5 ${color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {alert.href ? (
                        <Link href={alert.href} className="text-xs text-[var(--foreground)] hover:text-[var(--pichwai-gold-deep)] transition line-clamp-2">{alert.msg}</Link>
                      ) : (
                        <p className="text-xs text-[var(--foreground)] line-clamp-2">{alert.msg}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Upcoming Events scroll ──────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.18)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">Upcoming Events</h2>
          <Link href="/host/events" className="flex items-center gap-1 text-xs text-[var(--pichwai-gold-deep)] hover:underline">
            See All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-4 p-4 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[220px] h-36 bg-[var(--muted)] rounded-xl animate-pulse shrink-0" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[var(--muted-fg)] text-sm mb-4">No upcoming events.</p>
            <Link href="/host/events/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Create Event
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 p-4 overflow-x-auto scrollbar-thin">
            {upcoming.map((event) => {
              const type = EVENT_TYPES.find((t) => t.value === event.eventType);
              const dl   = daysLeft(event.eventDate);
              const budgetPct = Number(event.totalBudget) > 0
                ? Math.min(100, Math.round((Number(event.spentBudget) / Number(event.totalBudget)) * 100))
                : 0;
              const checklistTotal  = (event.checklist ?? []).length;
              const checklistDone   = (event.checklist ?? []).filter((t) => t.completed).length;
              const taskPct         = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
              const dlLabel = dl <= 0 ? 'Today!' : dl === 1 ? '1 day left' : `${dl} days left`;
              const dlColor = dl <= 3 ? 'text-red-600 bg-red-50' : dl <= 7 ? 'text-orange-600 bg-orange-50' : 'text-[var(--pichwai-gold-deep)] bg-[rgba(201,147,58,0.1)]';

              return (
                <Link
                  key={event.id}
                  href={`/host/events/${event.id}`}
                  className="min-w-[220px] max-w-[220px] bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 hover:border-[var(--pichwai-gold)] hover:shadow-md transition-all shrink-0 group"
                  style={{ background: `linear-gradient(145deg, var(--card-bg), ${type?.color ?? '#C9933A'}08)` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{type?.icon ?? '📅'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dlColor}`}>{dlLabel}</span>
                  </div>
                  <p className="font-semibold text-sm text-[var(--foreground)] truncate group-hover:text-[var(--pichwai-gold-deep)] transition-colors mb-1">{event.title}</p>
                  <p className="text-xs text-[var(--muted-fg)] mb-3">{event.eventDate}{event.venueCity ? ` · ${event.venueCity}` : ''}</p>

                  {/* Task progress */}
                  {checklistTotal > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-[var(--muted-fg)] mb-1">
                        <span>Tasks</span>
                        <span>{checklistDone}/{checklistTotal}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-full transition-all" style={{ width: `${taskPct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Budget progress */}
                  {Number(event.totalBudget) > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-[var(--muted-fg)] mb-1">
                        <span>Budget</span>
                        <span>{budgetPct}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${budgetPct > 85 ? 'bg-red-400' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} style={{ width: `${budgetPct}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Budget overview bar ─────────────────────────────────────────────── */}
      {!loading && totalBudget > 0 && (
        <motion.div {...fadeUp(0.22)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--pichwai-mid-brown)] flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--pichwai-gold)]" /> Overall Budget
            </h2>
            <div className="flex gap-4 text-xs text-[var(--muted-fg)]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#C9933A] to-[#E8C06B] inline-block" />Used {formatCurrency(totalSpent)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--muted)] border border-[var(--border)] inline-block" />Remaining {formatCurrency(totalBudget - totalSpent)}</span>
            </div>
          </div>
          <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--muted-fg)] mt-1.5">
            <span>{Math.round((totalSpent / totalBudget) * 100)}% used</span>
            <span>Total: {formatCurrency(totalBudget)}</span>
          </div>
        </motion.div>
      )}

      {/* ── Recent Events list ──────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.25)} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">All Events</h2>
          <Link href="/host/events" className="flex items-center gap-1 text-xs text-[var(--pichwai-gold-deep)] hover:underline">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--muted-fg)]">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--muted-fg)] mb-4">No events yet. Create your first one!</p>
            <Link href="/host/events/new" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition">
              <Plus className="h-4 w-4" /> Create Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[rgba(201,147,58,0.04)]">
                  {['Event', 'Date', 'Status', 'Guests', 'Budget', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {events.slice(0, 8).map((event) => {
                  const type = EVENT_TYPES.find((t) => t.value === event.eventType);
                  const STATUS_STYLES: Record<string, string> = {
                    draft: 'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
                    published: 'bg-blue-50 text-blue-700',
                    ongoing: 'bg-green-50 text-green-700',
                    completed: 'bg-purple-50 text-purple-700',
                    cancelled: 'bg-red-50 text-red-600',
                  };
                  return (
                    <tr key={event.id} className="hover:bg-[rgba(201,147,58,0.03)] transition group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{type?.icon ?? '📅'}</span>
                          <div>
                            <Link href={`/host/events/${event.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--pichwai-gold-deep)] transition truncate max-w-[180px] block">
                              {event.title}
                            </Link>
                            {event.venueCity && <p className="text-xs text-[var(--muted-fg)]">{event.venueCity}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--muted-fg)] whitespace-nowrap">{event.eventDate}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>{event.status}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--muted-fg)]">{event.confirmedGuests}/{event.expectedGuests}</td>
                      <td className="px-5 py-3 text-xs font-medium text-[var(--pichwai-gold-deep)]">{formatCurrency(event.totalBudget)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/host/events/${event.id}`} className="opacity-0 group-hover:opacity-100 transition">
                          <ChevronRight className="h-4 w-4 text-[var(--pichwai-gold)]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
