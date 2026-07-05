'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Users, UserCheck, Clock, ChevronRight, CalendarDays, Plus } from 'lucide-react';

interface EventSummary {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  venueCity?: string;
  expectedGuests: number;
  confirmedGuests: number;
  status: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('fetch failed');
    return r.json() as Promise<{ events: EventSummary[] }>;
  });

export default function GuestsOverviewPage() {
  const { data, isLoading, error } = useSWR(
    '/api/events?limit=50&sortBy=eventDate&sortOrder=asc',
    fetcher,
    { revalidateOnFocus: false },
  );

  const events = data?.events ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="inline-block px-6 py-3 rounded-xl bg-black/20 backdrop-blur-md border border-[rgba(201,147,58,0.2)]">
          <h1 className="font-playfair text-2xl font-bold text-[var(--pichwai-gold-deep)] drop-shadow-md">Guest Management</h1>
          <p className="text-sm text-[rgba(255,255,255,0.7)] mt-1 drop-shadow-md">Select an event to manage its guest list</p>
        </div>
        <Link
          href="/host/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white text-sm font-semibold hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Event
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
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
          <Users className="h-12 w-12 text-pichwai-gold/40 mx-auto mb-4" />
          <h2 className="font-playfair text-lg font-semibold text-pichwai-brown mb-2">No events yet</h2>
          <p className="text-sm text-gray-500 mb-6">Create an event to start managing guests</p>
          <Link
            href="/host/events/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Create your first event
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => {
          const pending = Math.max(0, event.expectedGuests - event.confirmedGuests);
          const confirmedPct =
            event.expectedGuests > 0
              ? Math.round((event.confirmedGuests / event.expectedGuests) * 100)
              : 0;
          return (
            <Link
              key={event.id}
              href={`/host/events/${event.id}/guests`}
              className="group bg-white border border-pichwai-gold/20 rounded-2xl p-5 hover:border-pichwai-gold/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-pichwai-brown truncate">{event.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {new Date(event.eventDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {event.venueCity && <> · {event.venueCity}</>}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-pichwai-gold/40 group-hover:text-pichwai-gold transition-colors shrink-0 mt-0.5" />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Expected',  value: event.expectedGuests,  Icon: Users,     color: 'text-pichwai-brown' },
                  { label: 'Confirmed', value: event.confirmedGuests, Icon: UserCheck, color: 'text-green-600' },
                  { label: 'Pending',   value: pending,               Icon: Clock,     color: 'text-amber-500' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pichwai-saffron to-pichwai-gold rounded-full transition-all"
                  style={{ width: `${confirmedPct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">{confirmedPct}% confirmed</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
