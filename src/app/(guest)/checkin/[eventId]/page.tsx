'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuestRow {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  rsvpStatus: string;
  tableNumber?: number | null;
  groupName?: string | null;
  isVip: boolean;
  checkInAt?: string | null;
  inviteToken?: string | null;
}

interface OfflineCheckIn {
  guestId: string;
  guestName: string;
  eventId: string;
  checkedInAt: string;
}

const QUEUE_KEY   = 'eventnest_checkin_queue';
const GUESTS_KEY  = (eid: string) => `eventnest_guests_${eid}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCsrfToken() {
  return typeof window !== 'undefined'
    ? document.cookie.split('; ').find((r) => r.startsWith('eventnest_csrf='))?.split('=')[1]
    : undefined;
}

async function markCheckIn(
  guestId: string,
  eventId: string,
  isOnline: boolean,
): Promise<'online' | 'queued'> {
  if (!isOnline) {
    const queue: OfflineCheckIn[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    queue.push({ guestId, guestName: '', eventId, checkedInAt: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return 'queued';
  }

  const csrf = getCsrfToken();
  const res  = await fetch(`/api/events/${eventId}/guests/${guestId}/checkin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
    body:    JSON.stringify({ checkInAt: new Date().toISOString() }),
  });

  if (!res.ok) throw new Error('Check-in failed');
  return 'online';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const { eventId } = useParams() as { eventId: string };
  const router      = useRouter();

  const [guests, setGuests]         = useState<GuestRow[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [isOnline, setIsOnline]     = useState(true);
  const [scanMode, setScanMode]     = useState(false);
  const [confirmGuest, setConfirm]  = useState<GuestRow | null>(null);
  const [syncing, setSyncing]       = useState(false);
  const [lastSync, setLastSync]     = useState<Date | null>(null);
  const [queueLen, setQueueLen]     = useState(0);
  const [eventTitle, setEventTitle] = useState('');
  const [scanError, setScanErr]     = useState('');

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const detectRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Online / offline status ──────────────────────────────────────────────

  useEffect(() => {
    const go  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  go);
    window.addEventListener('offline', off);
    setIsOnline(navigator.onLine);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', off); };
  }, []);

  // ── Load guests from API (or cache) ─────────────────────────────────────

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/events/${eventId}/guests?limit=500`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json() as { guests: GuestRow[]; event?: { title: string } };
      setGuests(data.guests);
      if (data.event?.title) setEventTitle(data.event.title);
      localStorage.setItem(GUESTS_KEY(eventId), JSON.stringify(data.guests));
    } catch {
      const cached = localStorage.getItem(GUESTS_KEY(eventId));
      if (cached) setGuests(JSON.parse(cached) as GuestRow[]);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  // ── Queue length ────────────────────────────────────────────────────────

  useEffect(() => {
    const update = () => {
      const q: OfflineCheckIn[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
      setQueueLen(q.filter((i) => i.eventId === eventId).length);
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [eventId]);

  // ── Sync offline queue ───────────────────────────────────────────────────

  const syncQueue = useCallback(async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      const queue: OfflineCheckIn[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
      const remaining: OfflineCheckIn[] = [];

      for (const item of queue) {
        try {
          await markCheckIn(item.guestId, item.eventId, true);
          // Update local guest list
          setGuests((prev) =>
            prev.map((g) => g.id === item.guestId ? { ...g, checkInAt: item.checkedInAt } : g),
          );
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      setQueueLen(remaining.filter((i) => i.eventId === eventId).length);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, [isOnline, eventId]);

  useEffect(() => {
    window.addEventListener('online', syncQueue);
    return () => window.removeEventListener('online', syncQueue);
  }, [syncQueue]);

  // ── Check-in action ──────────────────────────────────────────────────────

  const performCheckIn = useCallback(async (guest: GuestRow) => {
    const mode = await markCheckIn(guest.id, eventId, isOnline);
    const now  = new Date().toISOString();

    setGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, checkInAt: now } : g));

    // Persist to local cache
    const updated = guests.map((g) => g.id === guest.id ? { ...g, checkInAt: now } : g);
    localStorage.setItem(GUESTS_KEY(eventId), JSON.stringify(updated));

    if (mode === 'queued') {
      setQueueLen((n) => n + 1);
    }
    setConfirm(null);
  }, [eventId, guests, isOnline]);

  // ── QR scanner (BarcodeDetector API) ─────────────────────────────────────

  const startCamera = useCallback(async () => {
    setScanErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (!('BarcodeDetector' in window)) {
        setScanErr('QR scanning not supported in this browser. Use manual search below.');
        return;
      }

      const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ['qr_code'] });

      detectRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const qrValue = codes[0].rawValue;
            // QR contains the invite token URL: .../invite/[token]
            const tokenMatch = qrValue.match(/\/invite\/([A-Za-z0-9_-]+)/);
            if (tokenMatch) {
              const token = tokenMatch[1];
              const match = guests.find((g) => g.inviteToken === token);
              if (match && !match.checkInAt) {
                stopCamera();
                setScanMode(false);
                setConfirm(match);
              }
            }
          }
        } catch {}
      }, 500);
    } catch {
      setScanErr('Camera access denied. Use manual search to check in guests.');
    }
  }, [guests]);

  const stopCamera = useCallback(() => {
    if (detectRef.current) { clearInterval(detectRef.current); detectRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  useEffect(() => {
    if (scanMode) startCamera();
    else stopCamera();
  }, [scanMode, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const checkedIn = guests.filter((g) => g.checkInAt).length;
  const total     = guests.length;
  const pct       = total ? Math.round((checkedIn / total) * 100) : 0;

  // ── Filtered search ──────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filtered = q
    ? guests.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          (g.phone ?? '').includes(q) ||
          (g.email ?? '').toLowerCase().includes(q),
      )
    : guests.filter((g) => !g.checkInAt).slice(0, 50); // show unckecked-in first by default

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-pichwai-brown text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-playfair text-xl font-bold">{eventTitle || 'Check-In'}</h1>
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-green-400' : 'bg-red-400')} />
            <span className="text-xs opacity-60">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-3 bg-white/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm opacity-80">Checked In</span>
            <span className="text-lg font-bold text-pichwai-gold">{checkedIn} / {total}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-pichwai-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs opacity-60">
            <span>{pct}% checked in</span>
            {queueLen > 0 && (
              <span className="text-amber-300">
                {queueLen} pending sync
                {isOnline && (
                  <button
                    type="button"
                    onClick={syncQueue}
                    className="ml-2 underline"
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing…' : 'Sync now'}
                  </button>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search + scan toolbar */}
      <div className="px-4 py-3 bg-white/5 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/50"
        />
        <button
          type="button"
          onClick={() => setScanMode((v) => !v)}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
            scanMode ? 'bg-pichwai-gold text-white' : 'bg-white/10 text-white hover:bg-white/20',
          )}
        >
          {scanMode ? '✕ Stop' : '📷 Scan'}
        </button>
        <button
          type="button"
          onClick={loadGuests}
          className="px-3 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 text-sm"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* QR scanner view */}
      <AnimatePresence>
        {scanMode && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 240 }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-black relative"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-pichwai-gold rounded-2xl" />
            </div>
            {scanError && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-900/80 text-white text-xs rounded-xl px-3 py-2">
                {scanError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest list */}
      <div className="px-4 py-3 flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 opacity-40">
            <div className="text-3xl animate-pulse">🪔</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 opacity-40">
            <p className="text-sm">{search ? 'No guests found' : 'All guests checked in! 🎉'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((guest) => (
              <motion.button
                key={guest.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => !guest.checkInAt && setConfirm(guest)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                  guest.checkInAt
                    ? 'bg-green-900/30 opacity-60 cursor-default'
                    : 'bg-white/10 hover:bg-white/15 active:bg-white/20',
                )}
              >
                {/* Avatar initials */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  guest.checkInAt ? 'bg-green-600' : 'bg-pichwai-gold/20 text-pichwai-gold',
                )}>
                  {guest.checkInAt ? '✓' : guest.fullName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium truncate', guest.checkInAt && 'line-through opacity-60')}>
                      {guest.fullName}
                    </p>
                    {guest.isVip && <span className="text-xs text-pichwai-gold">⭐ VIP</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">
                    {guest.phone ?? guest.email ?? guest.groupName ?? ''}
                    {guest.tableNumber && ` · Table ${guest.tableNumber}`}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {guest.checkInAt ? (
                    <span className="text-xs text-green-400">
                      {new Date(guest.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-xs opacity-40 text-pichwai-gold">Tap to check in →</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Check-in confirmation modal */}
      <AnimatePresence>
        {confirmGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-pichwai-brown border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center"
            >
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-playfair text-xl font-bold mb-1">
                Check in {confirmGuest.fullName}?
              </h3>
              {confirmGuest.tableNumber && (
                <p className="text-sm opacity-60 mb-4">Table {confirmGuest.tableNumber}</p>
              )}
              {!isOnline && (
                <p className="text-xs text-amber-300 mb-3">
                  You're offline. Check-in will sync when you're back online.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium text-sm"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => performCheckIn(confirmGuest)}
                  className="flex-1 py-3 rounded-xl bg-pichwai-gold text-white font-semibold text-sm"
                >
                  Confirm Check-In
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
