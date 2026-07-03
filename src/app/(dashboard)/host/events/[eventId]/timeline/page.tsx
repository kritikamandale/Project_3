'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Plus, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimelineItem {
  id: string;
  time?: string;
  title: string;
  description?: string;
  category?: string;
  dueDate?: string;
  completed?: boolean;
  sortOrder?: number;
}

interface EventBrief {
  title: string;
  eventDate: string;
}

const CATEGORIES = ['ceremony', 'reception', 'catering', 'photography', 'decor', 'transport', 'other'];

const CAT_COLORS: Record<string, string> = {
  ceremony:     'border-l-purple-500 bg-purple-50',
  reception:    'border-l-blue-500 bg-blue-50',
  catering:     'border-l-orange-400 bg-orange-50',
  photography:  'border-l-pink-500 bg-pink-50',
  decor:        'border-l-green-500 bg-green-50',
  transport:    'border-l-gray-500 bg-gray-50',
  other:        'border-l-[#C9933A] bg-[rgba(201,147,58,0.06)]',
};

export default function TimelinePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent]       = useState<EventBrief | null>(null);
  const [items, setItems]       = useState<TimelineItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ time: '', title: '', description: '', category: 'other' });
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.event) {
          setEvent(d.event);
          const raw = Array.isArray(d.event.timeline) ? d.event.timeline as TimelineItem[] : [];
          setItems(raw.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addItem() {
    if (!form.title) return;
    setSaving(true);
    const newItem: TimelineItem = {
      id:          crypto.randomUUID(),
      time:        form.time,
      title:       form.title,
      description: form.description,
      category:    form.category,
      completed:   false,
      sortOrder:   items.length,
    };
    // Optimistic update — in a real implementation you'd PATCH the event's timeline field
    setItems((prev) => [...prev, newItem]);
    setForm({ time: '', title: '', description: '', category: 'other' });
    setShowForm(false);
    setSaving(false);
  }

  function moveItem(index: number, dir: -1 | 1) {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setItems(next);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Timeline</h1>
          {event && <p className="text-sm text-[var(--muted-fg)] mt-1">{event.title} · {event.eventDate}</p>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-4">New Timeline Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Baraat arrives, Pheras begin"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Description</label>
              <textarea
                placeholder="Additional details…"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addItem}
              disabled={saving || !form.title}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-sm font-medium text-[var(--muted-fg)] border border-[var(--border)] rounded-lg hover:border-[var(--pichwai-gold)] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <Clock className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-50" />
          <p className="text-[var(--muted-fg)]">No timeline items yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[2.75rem] top-0 bottom-0 w-px bg-gradient-to-b from-[#C9933A] via-[#E8C06B] to-transparent opacity-40" />

          <div className="space-y-3">
            {items.map((item, index) => {
              const isOpen = expanded.has(item.id);
              const catColors = CAT_COLORS[item.category ?? 'other'] ?? CAT_COLORS.other;
              return (
                <div key={item.id} className="flex gap-4 items-start">
                  {/* Time column */}
                  <div className="w-14 shrink-0 text-right">
                    {item.time ? (
                      <span className="text-xs font-mono text-[var(--pichwai-gold-deep)] font-semibold">{item.time}</span>
                    ) : (
                      <span className="text-xs text-[var(--muted-fg)]">—</span>
                    )}
                  </div>

                  {/* Dot */}
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C9933A] to-[#E8C06B] shrink-0 mt-1.5 shadow-sm ring-2 ring-white" />

                  {/* Card */}
                  <div className={cn('flex-1 border-l-4 rounded-r-xl rounded-tl-xl overflow-hidden shadow-sm border border-[var(--border-gold)]', catColors)}>
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => item.description && toggleExpanded(item.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="h-4 w-4 text-[var(--muted-fg)] shrink-0 opacity-50" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.title}</p>
                          {item.category && (
                            <p className="text-xs text-[var(--muted-fg)] capitalize">{item.category}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); moveItem(index, -1); }} disabled={index === 0} className="hover:text-[var(--pichwai-gold)] disabled:opacity-20 transition">
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveItem(index, 1); }} disabled={index === items.length - 1} className="hover:text-[var(--pichwai-gold)] disabled:opacity-20 transition">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {isOpen && item.description && (
                      <div className="px-4 pb-3 text-sm text-[var(--muted-fg)] border-t border-[rgba(201,147,58,0.15)]">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
