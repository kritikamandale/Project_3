'use client';

import React, { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import GuestTable, { type GuestRow } from '@/components/guests/GuestTable';
import Link from 'next/link';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (r.status === 401) throw new Error('401');
    if (!r.ok) throw new Error('fetch failed');
    return r.json() as Promise<{ guests: GuestRow[]; total: number }>;
  });

export default function GuestsPage() {
  const { eventId } = useParams() as { eventId: string };
  const router      = useRouter();

  const { data, error, mutate, isLoading } = useSWR(
    `/api/events/${eventId}/guests?limit=500`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const handleRefresh = useCallback(() => { mutate(); }, [mutate]);

  if (error?.message === '401') { router.push('/login'); return null; }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/host/events" className="hover:text-pichwai-brown transition-colors">
          Events
        </Link>
        <span>/</span>
        <Link href={`/host/events/${eventId}`} className="hover:text-pichwai-brown transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-pichwai-brown font-medium">Guests</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-pichwai-brown">Guest Management</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">{data.total} guest{data.total === 1 ? '' : 's'} total</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/host/events/${eventId}/seating`}
            className="px-4 py-2 rounded-xl border border-pichwai-gold text-pichwai-brown text-sm hover:bg-pichwai-gold/10 transition-colors"
          >
            🪑 Seating Planner
          </Link>
          <Link
            href={`/checkin/${eventId}`}
            target="_blank"
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            📷 Check-In View ↗
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {/* Stats skeleton */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Table skeleton */}
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-16 text-red-500">
          <p className="text-sm">Failed to load guests.</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="mt-3 text-sm underline text-pichwai-brown"
          >
            Retry
          </button>
        </div>
      )}

      {data && !isLoading && (
        <GuestTable
          eventId={eventId}
          guests={data.guests}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
