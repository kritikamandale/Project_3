'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { cn } from '@/lib/utils/cn';
import TaskList from '@/components/events/TaskList';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';
import { getStatusColor, getStatusLabel, getValidTransitions, type EventStatus } from '@/lib/events/stateMachine';
import type { ChecklistItem } from '@/lib/validators/event.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventData {
  id: string;
  title: string;
  eventType: string;
  status: EventStatus;
  eventDate: string;
  eventTime?: string;
  endDate?: string;
  venueName?: string;
  venueCity?: string;
  venueState?: string;
  totalBudget: string;
  spentBudget: string;
  coverImageUrl?: string;
  expectedGuests: number;
  confirmedGuests: number;
  checklist: ChecklistItem[];
  inviteToken: string;
  theme?: string;
  dresscode?: string;
  isPrivate: boolean;
}

interface GuestStats {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  maybe: number;
}

interface DashboardResponse {
  event: EventData;
  stats: GuestStats;
  upcomingTasks: ChecklistItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json()) as Promise<DashboardResponse>;

function formatCurrency(v: string | number): string {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function getCountdown(eventDate: string): string {
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return 'Event passed';
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today!';
  if (days === 1) return '1 day to go';
  if (days < 30)  return `${days} days to go`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} to go`;
}

function getDueDateStatus(dueDate?: string): 'overdue' | 'soon' | 'upcoming' | 'none' {
  if (!dueDate) return 'none';
  const diff = (new Date(dueDate).getTime() - Date.now()) / 86400000;
  if (diff < 0)  return 'overdue';
  if (diff <= 7) return 'soon';
  return 'upcoming';
}

function StatRing({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct    = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r      = 28;
  const circ   = 2 * Math.PI * r;
  const dash   = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" className="stroke-gray-100" />
          <motion.circle
            cx="32" cy="32" r={r}
            strokeWidth="6"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-pichwai-brown">
          {value}
        </span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function getCsrfToken() {
  return typeof window !== 'undefined'
    ? document.cookie.split('; ').find((r) => r.startsWith('eventnest_csrf='))?.split('=')[1]
    : undefined;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDashboardPage() {
  const params  = useParams();
  const router  = useRouter();
  const eventId = params.eventId as string;

  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    `/api/events/${eventId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [countdown, setCountdown] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');

  useEffect(() => {
    if (!data?.event.eventDate) return;
    const tick = () => setCountdown(getCountdown(data.event.eventDate));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [data?.event.eventDate]);

  const handleStatusTransition = useCallback(async (newStatus: EventStatus) => {
    if (!data) return;
    setTransitioning(true);
    try {
      const csrf = getCsrfToken();
      const res  = await fetch(`/api/events/${eventId}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Failed');
      await mutate();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setTransitioning(false);
    }
  }, [eventId, data, mutate]);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data?.event) return (
    <div className="flex flex-col items-center justify-center min-h-96 text-pichwai-brown/50">
      <div className="text-5xl mb-4">🌸</div>
      <p className="text-lg font-medium">Event not found</p>
      <Link href="/host/events" className="mt-4 text-sm text-pichwai-gold underline">
        Back to events
      </Link>
    </div>
  );

  const { event, stats, upcomingTasks } = data;
  const eventTypeInfo = EVENT_TYPES.find((e) => e.value === event.eventType);
  const budgetPct     = event.totalBudget !== '0'
    ? Math.min(100, Math.round((Number(event.spentBudget) / Number(event.totalBudget)) * 100))
    : 0;
  const validTransitions = getValidTransitions(event.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ── Event header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden bg-pichwai-brown"
      >
        {event.coverImageUrl && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        )}
        <div className="relative px-6 py-8 sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{eventTypeInfo?.icon}</span>
                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                  {eventTypeInfo?.label}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-white leading-tight">
                {event.title}
              </h1>

              {/* Date + venue */}
              <p className="text-white/70 mt-1 text-sm">
                {new Date(event.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
                {event.eventTime && ` · ${event.eventTime}`}
                {(event.venueName || event.venueCity) && (
                  <> · {[event.venueName, event.venueCity, event.venueState].filter(Boolean).join(', ')}</>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Status badge */}
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', getStatusColor(event.status))}>
                {getStatusLabel(event.status)}
              </span>

              {/* Countdown */}
              {countdown && (
                <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  ⏰ {countdown}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Link
              href={`/host/events/${eventId}/guests`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              👥 Add Guest
            </Link>
            <Link
              href={`/host/events/${eventId}/vendors`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              🛒 Find Vendors
            </Link>
            <Link
              href={`/host/events/${eventId}/seating`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              🪑 Seating Plan
            </Link>
            <Link
              href={`/host/events/${eventId}/budget`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              💰 Budget
            </Link>

            {/* Status transitions */}
            {validTransitions.map((t) => (
              <button
                key={t.to}
                type="button"
                onClick={() => handleStatusTransition(t.to)}
                disabled={transitioning}
                className="px-4 py-2 rounded-xl bg-pichwai-gold/80 hover:bg-pichwai-gold text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stats grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Guests</span>
          </div>
          <div className="flex justify-around">
            <StatRing value={stats.confirmed} max={stats.total} label="Confirmed" color="#C9933A" />
            <StatRing value={stats.pending}   max={stats.total} label="Pending"   color="#F4A825" />
            <StatRing value={stats.declined}  max={stats.total} label="Declined"  color="#ef4444" />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">{stats.total} total invited</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Budget</p>
          <p className="text-xl font-bold text-pichwai-brown">
            {formatCurrency(event.spentBudget)}
          </p>
          <p className="text-xs text-gray-400 mb-3">of {formatCurrency(event.totalBudget)}</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                budgetPct >= 90 ? 'bg-red-400' : budgetPct >= 70 ? 'bg-amber-400' : 'bg-pichwai-gold',
              )}
              initial={{ width: 0 }}
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{budgetPct}% used</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Tasks
          </p>
          {(() => {
            const all       = (event.checklist ?? []) as ChecklistItem[];
            const done      = all.filter((t) => t.completed).length;
            const taskPct   = all.length ? Math.round((done / all.length) * 100) : 0;
            return (
              <>
                <p className="text-xl font-bold text-pichwai-brown">{done}/{all.length}</p>
                <p className="text-xs text-gray-400 mb-3">complete</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pichwai-saffron to-pichwai-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${taskPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{taskPct}% done</p>
              </>
            );
          })()}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Invite Link
          </p>
          <p className="text-xs text-pichwai-brown/70 break-all mb-3">
            Share with your guests
          </p>
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/invite/${event.inviteToken}`;
              navigator.clipboard.writeText(url).then(() => alert('Invite link copied!'));
            }}
            className="w-full py-1.5 rounded-lg bg-pichwai-gold/10 text-pichwai-gold text-xs font-medium hover:bg-pichwai-gold/20 transition-colors"
          >
            📋 Copy Invite Link
          </button>
        </motion.div>
      </div>

      {/* ── Tabs: Overview / Tasks ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {(['overview', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-6 py-4 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'text-pichwai-gold border-b-2 border-pichwai-gold'
                  : 'text-gray-400 hover:text-pichwai-brown',
              )}
            >
              {tab === 'overview' ? '📊 Overview' : '✅ Tasks'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Upcoming tasks preview */}
              {upcomingTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-pichwai-brown text-sm">Upcoming Tasks</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs text-pichwai-gold hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => {
                      const st = getDueDateStatus(task.dueDate);
                      return (
                        <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            st === 'overdue' ? 'bg-red-400' : st === 'soon' ? 'bg-amber-400' : 'bg-green-400',
                          )} />
                          <span className="flex-1 text-sm text-pichwai-brown">{task.title}</span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">
                              {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Event details */}
              <div>
                <h3 className="font-semibold text-pichwai-brown text-sm mb-3">Event Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {event.theme && (
                    <div className="bg-pichwai-cream/30 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Theme</p>
                      <p className="font-medium text-pichwai-brown">{event.theme}</p>
                    </div>
                  )}
                  {event.dresscode && (
                    <div className="bg-pichwai-cream/30 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Dress Code</p>
                      <p className="font-medium text-pichwai-brown">{event.dresscode}</p>
                    </div>
                  )}
                  <div className="bg-pichwai-cream/30 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Expected Guests</p>
                    <p className="font-medium text-pichwai-brown">{event.expectedGuests}</p>
                  </div>
                  <div className="bg-pichwai-cream/30 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Privacy</p>
                    <p className="font-medium text-pichwai-brown">
                      {event.isPrivate ? '🔒 Private' : '🌐 Public'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick links to sub-pages */}
              <div>
                <h3 className="font-semibold text-pichwai-brown text-sm mb-3">Manage</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { href: 'guests',   icon: '👥', label: 'Guests'   },
                    { href: 'vendors',  icon: '🛒', label: 'Vendors'  },
                    { href: 'budget',   icon: '💰', label: 'Budget'   },
                    { href: 'seating',  icon: '🪑', label: 'Seating'  },
                    { href: 'timeline', icon: '📅', label: 'Timeline' },
                    { href: 'memories', icon: '📸', label: 'Memories' },
                  ].map(({ href, icon, label }) => (
                    <Link
                      key={href}
                      href={`/host/events/${eventId}/${href}`}
                      className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-pichwai-gold/40 hover:bg-pichwai-cream/20 transition-all text-sm text-pichwai-brown font-medium"
                    >
                      <span className="text-lg">{icon}</span>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <TaskList
              eventId={eventId}
              initialTasks={(event.checklist as ChecklistItem[]) ?? []}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-52 rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-gray-100" />
    </div>
  );
}
