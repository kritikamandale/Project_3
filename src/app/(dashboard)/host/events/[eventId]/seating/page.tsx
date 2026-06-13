'use client';

import React, { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import SeatingPlanner from '@/components/guests/SeatingPlanner';
import Link from 'next/link';

interface SeatingTable {
  id: string;
  label: string;
  shape: 'round' | 'rectangular' | 'cocktail';
  capacity: number;
  x: number;
  y: number;
}

interface GuestSeat {
  guestId: string;
  guestName: string;
  tableId: string;
}

interface GuestOption {
  id: string;
  fullName: string;
  rsvpStatus: string;
  tableNumber?: number | null;
}

interface SeatingData {
  tables: SeatingTable[];
  seats:  GuestSeat[];
  guests: GuestOption[];
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (r.status === 401) throw new Error('401');
    if (!r.ok) throw new Error('fetch failed');
    return r.json() as Promise<unknown>;
  });

export default function SeatingPage() {
  const { eventId } = useParams() as { eventId: string };
  const router      = useRouter();

  // Load seating plan (tables + seats) and guest list in parallel
  const { data: seatingRaw, error: seatingErr, isLoading: seatingLoading } = useSWR(
    `/api/events/${eventId}/seating`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: guestsRaw, error: guestsErr, isLoading: guestsLoading } = useSWR(
    `/api/events/${eventId}/guests?limit=500&rsvpStatus=confirmed`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (seatingErr?.message === '401' || guestsErr?.message === '401') {
    router.push('/login');
    return null;
  }

  const isLoading = seatingLoading || guestsLoading;
  const hasError  = !!(seatingErr || guestsErr) && !isLoading;

  const seating = seatingRaw as { tables?: SeatingTable[]; seats?: GuestSeat[] } | undefined;
  const guestsList = (guestsRaw as { guests?: GuestOption[] } | undefined)?.guests ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col gap-6 h-screen">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/host/events" className="hover:text-pichwai-brown transition-colors">
          Events
        </Link>
        <span>/</span>
        <Link href={`/host/events/${eventId}`} className="hover:text-pichwai-brown transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/host/events/${eventId}/guests`} className="hover:text-pichwai-brown transition-colors">
          Guests
        </Link>
        <span>/</span>
        <span className="text-pichwai-brown font-medium">Seating Planner</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-pichwai-brown">Seating Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag guests from the panel onto tables · Drag tables to reposition
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center opacity-40">
            <div className="text-4xl animate-pulse mb-3">🪑</div>
            <p className="text-sm text-pichwai-brown">Loading seating plan…</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">Failed to load seating data.</p>
        </div>
      )}

      {!isLoading && !hasError && (
        <div className="flex-1 min-h-0">
          <SeatingPlanner
            eventId={eventId}
            guests={guestsList}
            initialTables={seating?.tables ?? []}
            initialSeats={seating?.seats   ?? []}
          />
        </div>
      )}
    </div>
  );
}
