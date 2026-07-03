'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';
import { cn } from '@/lib/utils/cn';

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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_TABS = ['all', 'draft', 'published', 'ongoing', 'completed', 'cancelled'] as const;

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
  published: 'bg-blue-50 text-blue-700',
  ongoing:   'bg-green-50 text-green-700',
  completed: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-red-50 text-red-600',
};

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function HostEventsPage() {
  const [events, setEvents]           = useState<EventRow[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [status, setStatus]           = useState('all');
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchEvents = useCallback(async (page = 1, stat = status, q = search) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '12' });
      if (stat !== 'all') p.set('status', stat);
      if (q)              p.set('search', q);
      const res  = await fetch(`/api/events?${p}`);
      const data = await res.json() as { events: EventRow[]; pagination: Pagination };
      setEvents(data.events ?? []);
      setPagination(data.pagination ?? { page, limit: 12, total: 0, totalPages: 1 });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { fetchEvents(1, status, search); }, [status, search, fetchEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">My Events</h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">{pagination.total} event{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/host/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-fg)]" />
            <input
              type="text"
              placeholder="Search events…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-fg)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition',
                status === tab
                  ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-[var(--muted-fg)] mb-6">No events found. Create your first one!</p>
          <Link
            href="/host/events/new"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const type  = EVENT_TYPES.find((t) => t.value === event.eventType);
            const spent = Number(event.spentBudget);
            const total = Number(event.totalBudget);
            const pct   = total > 0 ? Math.min(100, (spent / total) * 100) : 0;

            return (
              <Link
                key={event.id}
                href={`/host/events/${event.id}`}
                className="group bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--pichwai-gold)] transition-all duration-200"
              >
                <div
                  className="h-20 flex items-center justify-center text-4xl relative"
                  style={{ background: `linear-gradient(135deg, ${type?.color ?? '#C9933A'}22, ${type?.color ?? '#C9933A'}55)` }}
                >
                  <span>{type?.icon ?? '📅'}</span>
                  <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                    {event.status}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <p className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--pichwai-gold-deep)] transition-colors">
                    {event.title}
                  </p>
                  <div className="space-y-1 text-xs text-[var(--muted-fg)]">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{event.eventDate}</div>
                    {event.venueCity && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.venueCity}</div>}
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{event.confirmedGuests}/{event.expectedGuests} guests</div>
                  </div>
                  {total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-[var(--muted-fg)] mb-1">
                        <span>Budget</span>
                        <span>{formatCurrency(spent)} / {formatCurrency(total)}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchEvents(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--muted-fg)]">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => fetchEvents(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
