'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';
import { cn } from '@/lib/utils/cn';

interface AdminEvent {
  id: string;
  title: string;
  eventType: string;
  status: string;
  eventDate: string;
  venueCity?: string;
  expectedGuests: number;
  totalBudget: string;
  hostId: string;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const STATUS_TABS = ['all', 'draft', 'published', 'ongoing', 'completed', 'cancelled'] as const;

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
  published: 'bg-blue-50 text-blue-700',
  ongoing:   'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
};

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function AdminEventsPage() {
  const [events, setEvents]           = useState<AdminEvent[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [status, setStatus]           = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');

  const fetchEvents = useCallback(async (page = 1, stat = status, q = search) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (stat !== 'all') p.set('status', stat);
      if (q)              p.set('search', q);
      const res  = await fetch(`/api/admin/events?${p}`);
      const data = await res.json() as { events: AdminEvent[]; pagination: Pagination };
      setEvents(data.events ?? []);
      setPagination(data.pagination ?? { page, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { fetchEvents(1, status, search); }, [status, search, fetchEvents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">All Events</h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">{pagination.total} total events on platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
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
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition">Search</button>
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

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[var(--muted-fg)] text-sm">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center">
            <CalendarDays className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--muted-fg)]">No events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[rgba(201,147,58,0.04)]">
                  {['Event', 'Type', 'Status', 'Date', 'Guests', 'Budget'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {events.map((event) => {
                  const type = EVENT_TYPES.find((t) => t.value === event.eventType);
                  return (
                    <tr key={event.id} className="hover:bg-[rgba(201,147,58,0.03)] transition">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)] max-w-[200px] truncate">{event.title}</td>
                      <td className="px-4 py-3 text-[var(--muted-fg)]">
                        <span className="flex items-center gap-1.5"><span>{type?.icon ?? '📅'}</span>{type?.label ?? event.eventType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted-fg)]">{event.eventDate}</td>
                      <td className="px-4 py-3 text-xs text-[var(--muted-fg)]">{event.expectedGuests}</td>
                      <td className="px-4 py-3 text-xs font-medium text-[var(--pichwai-gold-deep)]">{formatCurrency(event.totalBudget)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchEvents(pagination.page - 1)} disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--muted-fg)]">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchEvents(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
