'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AIAssistant } from '@/components/ai/AIAssistant';

interface EventOption {
  id:    string;
  title: string;
}

export default function AIAssistantPage() {
  const [events, setEvents]   = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data: { events?: EventOption[] }) => {
        setEvents(data.events ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🪔</span>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-pichwai-brown">
              AI Planning Assistant
            </h1>
            <p className="text-sm text-pichwai-brown/60">
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
              className="text-xs px-3 py-1 rounded-full bg-pichwai-gold/10 text-pichwai-brown/70 border border-pichwai-gold/20"
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
            <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-pichwai-gold/20">
              <div className="text-pichwai-brown/40 text-sm">Loading…</div>
            </div>
          ) : (
            <AIAssistant events={events} />
          )}
        </div>

        {/* Sidebar — context & tips */}
        <div className="space-y-4">
          {/* How to use */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
          >
            <h3 className="font-semibold text-pichwai-brown mb-3 text-sm">💡 What you can ask</h3>
            <ul className="space-y-2 text-xs text-pichwai-brown/70">
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-pichwai-saffron/10 to-pichwai-gold/10 rounded-2xl border border-pichwai-gold/20 p-5"
          >
            <h3 className="font-semibold text-pichwai-brown mb-2 text-sm">📊 Your Plan</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-pichwai-brown/70">Daily messages</span>
                <span className="text-xs font-medium text-pichwai-brown">20 / day (Free)</span>
              </div>
              <div className="w-full h-1.5 bg-pichwai-gold/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pichwai-saffron to-pichwai-gold w-0 rounded-full transition-all" />
              </div>
              <p className="text-[10px] text-pichwai-brown/40">
                Upgrade to Premium for unlimited AI messages + priority responses
              </p>
            </div>
          </motion.div>

          {/* Indian events card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-pichwai-gold/20 p-5"
          >
            <h3 className="font-semibold text-pichwai-brown mb-3 text-sm">🎊 Specialities</h3>
            <div className="grid grid-cols-2 gap-2">
              {['💍 Weddings', '🎂 Birthdays', '👶 Baby Showers', '🏠 Griha Pravesh', '🎓 Graduation', '💐 Engagement'].map((event) => (
                <span key={event} className="text-xs text-pichwai-brown/70 bg-pichwai-cream/50 rounded-lg px-2 py-1.5">
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
