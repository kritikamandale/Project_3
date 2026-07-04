'use client';

import React from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { AIAssistant } from '@/components/ai/AIAssistant';

interface EventOption {
  id:    string;
  title: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : { events: [] })) as Promise<{ events: EventOption[] }>;

export default function AIAssistantPage() {
  const { data, isLoading: loading } = useSWR('/api/events?limit=50', fetcher, {
    revalidateOnFocus: false,
  });
  const events = data?.events ?? [];

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-6 flex-shrink-0 bg-gradient-to-r from-[#D4AF37] to-[#E8C06B] p-6 rounded-xl shadow-md border border-[#B8860B]"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🪔</span>
          <div>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: '#5C0A38' }}>
              AI Planning Assistant
            </h1>
            <p className="text-sm font-medium" style={{ color: '#5C0A38', opacity: 0.9 }}>
              Your warm, knowledgeable event planning companion
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            '✓ Budget planning in ₹',
            '✓ Vendor recommendations',
            '✓ Timelines & checklists',
            '✓ Regional expertise',
            '✓ Hindi & English',
          ].map((feature) => (
            <span
              key={feature}
              className="text-xs px-3 py-1 rounded-full font-medium border"
              style={{ backgroundColor: 'rgba(92, 10, 56, 0.1)', color: '#5C0A38', borderColor: 'rgba(92, 10, 56, 0.3)' }}
            >
              {feature}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Two-column layout: chat left, info right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat — takes 2/3 on desktop */}
        <div className="lg:col-span-2 flex flex-col min-h-[600px] lg:min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-[var(--card-bg)] rounded-2xl border border-[var(--border-gold)]">
              <div className="text-[var(--muted-fg)] text-sm">Loading…</div>
            </div>
          ) : (
            <AIAssistant events={events} />
          )}
        </div>

        {/* Sidebar — context & tips */}
        <div className="space-y-4">
          {/* How to use */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-gold)] p-5"
          >
            <h3 className="font-semibold text-[var(--foreground)] mb-3 text-sm">💡 What you can ask</h3>
            <ul className="space-y-2 text-xs text-[var(--muted-fg)]">
              <li className="flex items-start gap-2">
                <span className="text-pichwai-gold mt-0.5">•</span>
                &quot;Plan a Rajasthani wedding for 300 guests under ₹15 lakhs&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pichwai-gold mt-0.5">•</span>
                &quot;What are good mehendi designers in Mumbai?&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pichwai-gold mt-0.5">•</span>
                &quot;Generate a 6-month wedding checklist&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pichwai-gold mt-0.5">•</span>
                &quot;Write a WhatsApp message inviting guests to my son&apos;s birthday&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pichwai-gold mt-0.5">•</span>
                &quot;Suggest a vegetarian menu for 150 guests in Pune&quot;
              </li>
            </ul>
          </motion.div>

          {/* Plan info */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-gold)] p-5"
          >
            <h3 className="font-semibold text-[var(--foreground)] mb-2 text-sm">📊 Your Plan</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--muted-fg)]">Daily messages</span>
                <span className="text-xs font-medium text-[var(--foreground)]">20 / day (Free)</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C9933A] to-[#E8C06B] w-0 rounded-full transition-all" />
              </div>
              <p className="text-[10px] text-[var(--muted-fg)]">
                Upgrade to Premium for unlimited AI messages + priority responses
              </p>
            </div>
          </motion.div>

          {/* Indian events card */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-gold)] p-5"
          >
            <h3 className="font-semibold text-[var(--foreground)] mb-3 text-sm">🎊 Specialities</h3>
            <div className="grid grid-cols-2 gap-2">
              {['💍 Weddings', '🎂 Birthdays', '👶 Baby Showers', '🏠 Griha Pravesh', '🎓 Graduation', '💐 Engagement'].map((event) => (
                <span key={event} className="text-xs text-[var(--pichwai-gold)] bg-[var(--muted)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  {event}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
