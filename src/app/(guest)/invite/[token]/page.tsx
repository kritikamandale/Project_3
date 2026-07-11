'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_TYPES } from '@/lib/constants/eventTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venueName?: string;
  venueCity?: string;
  venueState?: string;
  venueAddress?: string;
  coverImageUrl?: string;
  theme?: string;
  dresscode?: string;
  specialInstructions?: string;
}

interface PrefillGuest {
  id: string;
  fullName: string;
  email?: string | null;
  rsvpStatus: string;
  mealPreference?: string | null;
  plusOne: boolean;
  plusOneName?: string | null;
}

interface InviteData {
  event: InviteEvent;
  guest: PrefillGuest | null;
  isPersonalised: boolean;
}

type Phase = 'loading' | 'form' | 'success' | 'error' | 'cancelled';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCountdown(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Event has passed';
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today!';
  if (days === 1) return '1 day to go';
  if (days < 30)  return `${days} days to go`;
  return `${Math.floor(days / 30)} months to go`;
}

const MEAL_OPTIONS = [
  { value: 'no_preference', label: 'No Preference' },
  { value: 'veg',           label: '🥦 Vegetarian' },
  { value: 'non_veg',       label: '🍗 Non-Vegetarian' },
  { value: 'jain',          label: '🌿 Jain' },
  { value: 'vegan',         label: '🌱 Vegan' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitePage() {
  const { token } = useParams() as { token: string };

  const [phase, setPhase]       = useState<Phase>('loading');
  const [data, setData]         = useState<InviteData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [submitting, setSub]    = useState(false);

  // Form state
  const [name, setName]         = useState('');
  const [rsvp, setRsvp]         = useState<'confirmed' | 'declined' | 'maybe'>('confirmed');
  const [plusOne, setPlusOne]   = useState(false);
  const [plusOneName, setPON]   = useState('');
  const [meal, setMeal]         = useState('no_preference');
  const [dietary, setDietary]   = useState('');

  // Load invite data (try cache first for offline support)
  useEffect(() => {
    const CACHE_KEY = `milap_invite_${token}`;

    const load = async () => {
      try {
        const res  = await fetch(`/api/invite/${token}`);
        if (res.status === 410) { setPhase('cancelled'); return; }
        if (!res.ok) { setPhase('error'); return; }

        const json = await res.json() as InviteData;
        localStorage.setItem(CACHE_KEY, JSON.stringify(json));
        applyData(json);
      } catch {
        // Offline — try cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          applyData(JSON.parse(cached) as InviteData);
        } else {
          setPhase('error');
        }
      }
    };

    const applyData = (json: InviteData) => {
      setData(json);
      if (json.guest) {
        setName(json.guest.fullName);
        if (json.guest.mealPreference) setMeal(json.guest.mealPreference);
        setPlusOne(json.guest.plusOne);
        if (json.guest.plusOneName) setPON(json.guest.plusOneName);
      }
      setPhase('form');
    };

    load();
  }, [token]);

  // Countdown ticker
  useEffect(() => {
    if (!data?.event.eventDate) return;
    const tick = () => setCountdown(getCountdown(data.event.eventDate));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [data?.event.eventDate]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setSub(true);

    const payload = {
      rsvpStatus:  rsvp,
      fullName:    name.trim(),
      plusOne,
      plusOneName: plusOne ? plusOneName.trim() : undefined,
      mealPreference: meal,
      dietaryRestrictions: dietary.trim() || undefined,
      consentGiven: true,
    };

    // Try online first; fall back to offline queue
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      setPhase('success');
    } catch {
      // Queue for later sync
      const QUEUE_KEY = 'milap_rsvp_queue';
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as unknown[];
      queue.push({ token, payload, queuedAt: new Date().toISOString() });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setPhase('success'); // Show success — will sync when back online
    } finally {
      setSub(false);
    }
  }, [token, name, rsvp, plusOne, plusOneName, meal, dietary]);

  // Sync queued RSVPs when back online
  useEffect(() => {
    const syncQueue = async () => {
      const QUEUE_KEY = 'milap_rsvp_queue';
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as Array<{
        token: string;
        payload: unknown;
      }>;
      if (!queue.length) return;

      const remaining: typeof queue = [];
      for (const item of queue) {
        try {
          const res = await fetch(`/api/invite/${item.token}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(item.payload),
          });
          if (!res.ok) remaining.push(item);
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    };

    window.addEventListener('online', syncQueue);
    return () => window.removeEventListener('online', syncQueue);
  }, []);

  if (phase === 'loading') return <FullPageLoader />;
  if (phase === 'cancelled') return <CancelledCard />;
  if (phase === 'error') return <ErrorCard />;
  if (phase === 'success') return <SuccessCard data={data} rsvp={rsvp} countdown={countdown} />;

  const event = data!.event;
  const typeInfo = EVENT_TYPES.find((e) => e.value === event.eventType);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Event card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(62,32,0,0.14)] overflow-hidden mb-6"
        >
          {/* Cover image or gradient header */}
          {event.coverImageUrl ? (
            <div className="h-48 overflow-hidden relative">
              <Image
                src={event.coverImageUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pichwai-brown/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-24 bg-gradient-to-r from-pichwai-brown via-pichwai-saffron/80 to-pichwai-gold" />
          )}

          <div className="px-6 py-5">
            {/* Type + title */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeInfo?.icon}</span>
              <span className="text-xs text-pichwai-brown/50 uppercase tracking-widest font-medium">
                {typeInfo?.label}
              </span>
            </div>
            <h1 className="font-playfair text-2xl font-bold text-pichwai-brown leading-tight mb-4">
              {event.title}
            </h1>

            {/* Date / venue */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-pichwai-brown/80">
                <span>📅</span>
                <span>
                  {new Date(event.eventDate).toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                  {event.eventTime && ` · ${event.eventTime}`}
                </span>
              </div>
              {(event.venueName || event.venueCity) && (
                <div className="flex items-start gap-2 text-pichwai-brown/80">
                  <span>📍</span>
                  <span>
                    {[event.venueName, event.venueAddress, event.venueCity, event.venueState]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {event.dresscode && (
                <div className="flex items-start gap-2 text-pichwai-brown/80">
                  <span>👗</span>
                  <span>Dress code: {event.dresscode}</span>
                </div>
              )}
              {event.theme && (
                <div className="flex items-start gap-2 text-pichwai-brown/80">
                  <span>🎨</span>
                  <span>Theme: {event.theme}</span>
                </div>
              )}
            </div>

            {/* Countdown chip */}
            {countdown && (
              <div className="mt-4 inline-flex items-center gap-1.5 bg-pichwai-gold/10 text-pichwai-gold px-3 py-1.5 rounded-full text-sm font-medium">
                ⏰ {countdown}
              </div>
            )}
          </div>
        </motion.div>

        {/* RSVP form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(62,32,0,0.08)] p-6 space-y-5"
        >
          <div>
            <h2 className="font-playfair text-xl font-bold text-pichwai-brown mb-0.5">
              Your RSVP
            </h2>
            <p className="text-sm text-pichwai-brown/50">
              Please let the host know if you&apos;ll be attending
            </p>
          </div>

          {/* Name */}
          {(!data!.isPersonalised || !data!.guest) && (
            <div>
              <label className="block text-sm font-medium text-pichwai-brown mb-1.5">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-pichwai-brown focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
              />
            </div>
          )}

          {/* Attending? */}
          <div>
            <label className="block text-sm font-medium text-pichwai-brown mb-2">
              Will you attend?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'confirmed', label: '✅ Yes', color: 'bg-green-50 border-green-300 text-green-700' },
                { v: 'maybe',     label: '🤔 Maybe', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                { v: 'declined',  label: '❌ No',   color: 'bg-red-50 border-red-300 text-red-700'   },
              ] as const).map(({ v, label, color }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRsvp(v)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    rsvp === v ? color + ' shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {rsvp === 'confirmed' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* +1 toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={plusOne}
                    onClick={() => setPlusOne((v) => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${plusOne ? 'bg-pichwai-gold' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${plusOne ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className="text-sm text-pichwai-brown">Bringing a +1?</span>
                </div>

                {plusOne && (
                  <input
                    value={plusOneName}
                    onChange={(e) => setPON(e.target.value)}
                    placeholder="+1 guest's name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-pichwai-brown text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
                  />
                )}

                {/* Meal preference */}
                <div>
                  <label className="block text-sm font-medium text-pichwai-brown mb-1.5">
                    Meal Preference
                  </label>
                  <select
                    value={meal}
                    onChange={(e) => setMeal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-pichwai-brown text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
                  >
                    {MEAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dietary notes */}
                <div>
                  <label className="block text-sm font-medium text-pichwai-brown mb-1.5">
                    Dietary Restrictions (optional)
                  </label>
                  <input
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="e.g. Nut allergy, Gluten-free..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-pichwai-brown text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || (!name && !data!.isPersonalised)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white font-semibold text-base shadow-md disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Submitting…' : 'Submit RSVP'}
          </motion.button>

          {event.specialInstructions && (
            <p className="text-xs text-pichwai-brown/50 text-center pt-1">
              📝 {event.specialInstructions}
            </p>
          )}
        </motion.div>

        <p className="text-center text-xs text-pichwai-brown/30 mt-6">
          Powered by Milap 🌸
        </p>
      </div>
    </div>
  );
}

// ─── Sub-states ───────────────────────────────────────────────────────────────

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-pulse">🪔</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🌸</div>
        <h2 className="font-playfair text-xl font-bold text-pichwai-brown mb-2">
          Invite Not Found
        </h2>
        <p className="text-pichwai-brown/60 text-sm">
          This invite link is invalid or has expired. Please contact the host for a new link.
        </p>
      </div>
    </div>
  );
}

function CancelledCard() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="font-playfair text-xl font-bold text-pichwai-brown mb-2">
          Event Cancelled
        </h2>
        <p className="text-pichwai-brown/60 text-sm">
          Unfortunately, this event has been cancelled. Please contact the host for more information.
        </p>
      </div>
    </div>
  );
}

function SuccessCard({
  data,
  rsvp,
  countdown,
}: {
  data: InviteData | null;
  rsvp: 'confirmed' | 'declined' | 'maybe';
  countdown: string;
}) {
  const icon  = rsvp === 'confirmed' ? '🎉' : rsvp === 'maybe' ? '🤔' : '😢';
  const title = rsvp === 'confirmed' ? "You're all set!" : rsvp === 'maybe' ? 'Response recorded!' : 'RSVP noted';
  const sub   = rsvp === 'confirmed'
    ? 'We look forward to seeing you there!'
    : rsvp === 'maybe'
    ? 'The host has been notified. You can update your RSVP later.'
    : 'Sorry to hear that. The host has been notified.';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(62,32,0,0.14)] p-8 max-w-sm w-full text-center"
      >
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="font-playfair text-2xl font-bold text-pichwai-brown mb-2">{title}</h2>
        <p className="text-pichwai-brown/60 text-sm mb-6">{sub}</p>

        {data?.event && rsvp === 'confirmed' && (
          <div className="bg-pichwai-cream/50 rounded-2xl p-4 text-left space-y-2 text-sm text-pichwai-brown">
            <p className="font-semibold">{data.event.title}</p>
            <p className="text-pichwai-brown/70">
              📅{' '}
              {new Date(data.event.eventDate).toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'long',
              })}
              {data.event.eventTime && ` at ${data.event.eventTime}`}
            </p>
            {(data.event.venueName || data.event.venueCity) && (
              <p className="text-pichwai-brown/70">
                📍 {[data.event.venueName, data.event.venueCity].filter(Boolean).join(', ')}
              </p>
            )}
            {countdown && (
              <div className="mt-2 inline-flex items-center gap-1 bg-pichwai-gold/15 text-pichwai-gold px-2.5 py-1 rounded-full text-xs font-medium">
                ⏰ {countdown}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-pichwai-brown/30 mt-6">Powered by Milap 🌸</p>
      </motion.div>
    </div>
  );
}
