'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Wallet, ChevronRight, CalendarDays, Plus } from 'lucide-react';

interface EventSummary {
  id: string;
  title: string;
  eventDate: string;
  venueCity?: string;
  totalBudget: string;
  spentBudget: string;
}

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('fetch failed');
    return r.json() as Promise<{ events: EventSummary[] }>;
  });

export default function BudgetOverviewPage() {
  const { data, isLoading, error } = useSWR(
    '/api/events?limit=50',
    fetcher,
    { revalidateOnFocus: false },
  );

  const events = data?.events ?? [];
  const totalBudget    = events.reduce((s, e) => s + Number(e.totalBudget),  0);
  const totalSpent     = events.reduce((s, e) => s + Number(e.spentBudget),  0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Budget Overview</h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">Track spending across all your events</p>
        </div>
        <Link
          href="/host/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-16 text-red-500 text-sm">
          Failed to load events. Please refresh the page.
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-20">
          <Wallet className="h-12 w-12 text-[var(--pichwai-gold)] mx-auto mb-4 opacity-40" />
          <h2 className="font-playfair text-lg font-semibold text-pichwai-brown mb-2">No events yet</h2>
          <p className="text-sm text-[var(--muted-fg)] mb-6">Create an event to start tracking your budget</p>
          <Link
            href="/host/events/new"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition"
          >
            Create your first event
          </Link>
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <>
          {/* Aggregate summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Budget',    value: formatCurrency(totalBudget),                     color: 'text-[var(--pichwai-gold)]' },
              { label: 'Total Spent',     value: formatCurrency(totalSpent),                      color: 'text-orange-500' },
              { label: 'Total Remaining', value: formatCurrency(Math.max(0, totalRemaining)),     color: totalRemaining >= 0 ? 'text-green-600' : 'text-red-500' },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[var(--muted-fg)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-event rows */}
          <div className="space-y-3">
            {events.map((event) => {
              const budget    = Number(event.totalBudget);
              const spent     = Number(event.spentBudget);
              const remaining = budget - spent;
              const pct       = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

              return (
                <Link
                  key={event.id}
                  href={`/host/events/${event.id}/budget`}
                  className="group flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-2xl p-5 hover:border-[var(--pichwai-gold)] hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgba(201,147,58,0.12)] flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5 text-[var(--pichwai-gold)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-semibold text-[var(--foreground)] truncate">{event.title}</h2>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-sm font-bold text-[var(--pichwai-gold-deep)]">{formatCurrency(spent)}</span>
                        <span className="text-xs text-[var(--muted-fg)]">/ {formatCurrency(budget)}</span>
                        <ChevronRight className="h-4 w-4 text-[var(--muted-fg)] group-hover:text-[var(--pichwai-gold)] transition-colors" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--muted-fg)] shrink-0">{pct.toFixed(0)}%</span>
                      <span className={`text-xs font-medium shrink-0 ${remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(-remaining)} over`}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-fg)] mt-1 flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {new Date(event.eventDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {event.venueCity && <> · {event.venueCity}</>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
