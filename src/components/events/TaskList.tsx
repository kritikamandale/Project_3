'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import type { ChecklistItem } from '@/lib/validators/event.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskListProps {
  eventId: string;
  initialTasks: ChecklistItem[];
  readOnly?: boolean;
}

type Priority = 'low' | 'medium' | 'high';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDueDateStatus(dueDate?: string): 'overdue' | 'soon' | 'upcoming' | 'none' {
  if (!dueDate) return 'none';
  const diffDays = (new Date(dueDate).getTime() - Date.now()) / 86400000;
  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 7) return 'soon';
  return 'upcoming';
}

function dueDateClass(status: ReturnType<typeof getDueDateStatus>): string {
  if (status === 'overdue')  return 'text-red-600 bg-red-50 border-red-200';
  if (status === 'soon')     return 'text-amber-600 bg-amber-50 border-amber-200';
  if (status === 'upcoming') return 'text-green-600 bg-green-50 border-green-200';
  return 'text-gray-400 bg-gray-50 border-gray-200';
}

function priorityDot(p: Priority): string {
  return p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-amber-400' : 'bg-green-400';
}

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupByCategory(tasks: ChecklistItem[]): Record<string, ChecklistItem[]> {
  return tasks.reduce<Record<string, ChecklistItem[]>>((acc, t) => {
    const cat = t.category || 'other';
    (acc[cat] = acc[cat] ?? []).push(t);
    return acc;
  }, {});
}

const CATEGORY_LABELS: Record<string, string> = {
  venue:         '🏛️ Venue',
  catering:      '🍽️ Catering',
  photography:   '📷 Photography',
  decoration:    '🌸 Decoration',
  mehendi:       '🎨 Mehendi',
  makeup:        '💄 Makeup',
  music:         '🎵 Music',
  transport:     '🚗 Transport',
  invites:       '✉️ Invitations',
  guests:        '👥 Guests',
  seating:       '🪑 Seating',
  logistics:     '📋 Logistics',
  outfits:       '👗 Outfits',
  gifts:         '🎁 Gifts',
  activities:    '🎮 Activities',
  cake:          '🎂 Cake',
  entertainment: '🎭 Entertainment',
  samagri:       '🪔 Samagri',
  priest:        '🙏 Priest',
  setup:         '⚙️ Setup',
  speakers:      '🎤 Speakers',
  av_tech:       '📽️ AV & Tech',
  materials:     '📦 Materials',
  registration:  '📝 Registration',
  anchor:        '🎙️ Anchor',
  memories:      '📸 Memories',
  flowers:       '💐 Flowers',
  other:         '📌 Other',
};

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? `📌 ${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
}

function getCsrfToken() {
  return typeof window !== 'undefined'
    ? document.cookie.split('; ').find((r) => r.startsWith('eventnest_csrf='))?.split('=')[1]
    : undefined;
}

// ─── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  absIdx,
  onToggle,
  onDelete,
  onNotesChange,
  onDragStart,
  onDragOver,
  onDrop,
  readOnly,
}: {
  task: ChecklistItem;
  absIdx: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, idx: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, idx: number) => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setNotes]  = useState(task.notes ?? '');
  const dueSt = getDueDateStatus(task.dueDate);

  return (
    <div
      draggable={!readOnly}
      onDragStart={(e) => onDragStart(e, absIdx)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, absIdx)}
      className={cn(
        'group rounded-xl border bg-white transition-all',
        task.completed ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-pichwai-gold/40 hover:shadow-sm',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {!readOnly && (
          <span className="text-gray-300 cursor-grab active:cursor-grabbing text-lg select-none leading-none">
            ⠿
          </span>
        )}

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => !readOnly && onToggle(task.id)}
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
            task.completed
              ? 'border-pichwai-gold bg-pichwai-gold text-white'
              : 'border-gray-300 hover:border-pichwai-gold',
          )}
        >
          {task.completed && <span className="text-[10px] leading-none">✓</span>}
        </button>

        {/* Priority */}
        <div
          className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDot(task.priority))}
          title={`${task.priority} priority`}
        />

        {/* Title */}
        <span
          className={cn(
            'flex-1 text-sm text-pichwai-brown',
            task.completed && 'line-through text-gray-400',
          )}
        >
          {task.title}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', dueDateClass(dueSt))}>
            {dueSt === 'overdue' ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}

        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1 text-xs text-gray-400 hover:text-pichwai-brown rounded"
            >
              {expanded ? '▲' : '▼'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 text-xs text-gray-300 hover:text-red-400 rounded"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-[52px]">
              <textarea
                value={localNotes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onNotesChange(task.id, localNotes)}
                rows={2}
                placeholder="Add notes…"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 text-pichwai-brown placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-pichwai-gold/40 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add task inline form ──────────────────────────────────────────────────────

function AddTaskForm({ onAdd }: { onAdd: (t: ChecklistItem) => void }) {
  const [open, setOpen]    = useState(false);
  const [title, setTitle]  = useState('');
  const [cat, setCat]      = useState('other');
  const [pri, setPri]      = useState<Priority>('medium');
  const [due, setDue]      = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: nanoid(), title: title.trim(), category: cat, priority: pri, dueDate: due || undefined, completed: false });
    setTitle(''); setDue(''); setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-pichwai-gold/30 rounded-xl text-sm text-pichwai-brown/50 hover:text-pichwai-brown hover:border-pichwai-gold/60 transition-colors"
      >
        + Add custom task
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-pichwai-gold/30 bg-pichwai-cream/20 p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Task title…"
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-pichwai-brown focus:outline-none focus:ring-1 focus:ring-pichwai-gold/40"
      />
      <div className="flex gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-pichwai-brown focus:outline-none">
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={pri} onChange={(e) => setPri(e.target.value as Priority)}
          className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-pichwai-brown focus:outline-none">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-pichwai-brown focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={submit}
          className="flex-1 py-2 rounded-lg bg-pichwai-gold text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Add Task
        </button>
        <button type="button" onClick={() => { setOpen(false); setTitle(''); }}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main TaskList ─────────────────────────────────────────────────────────────

export default function TaskList({ eventId, initialTasks, readOnly = false }: TaskListProps) {
  const [tasks, setTasks]       = useState<ChecklistItem[]>(initialTasks);
  const [saving, setSaving]     = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIdxRef                = useRef<number | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pct            = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const scheduleSave = useCallback((updated: ChecklistItem[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method:  'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(getCsrfToken() ? { 'x-csrf-token': getCsrfToken()! } : {}),
          },
          body: JSON.stringify({ checklist: updated }),
        });
        if (!res.ok) throw new Error();
        setLastSaved(new Date());
      } catch {
        toast.error('Failed to save tasks');
      } finally {
        setSaving(false);
      }
    }, 500);
  }, [eventId]);

  const updateTasks = useCallback((updated: ChecklistItem[]) => {
    setTasks(updated);
    if (!readOnly) scheduleSave(updated);
  }, [readOnly, scheduleSave]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    dragIdxRef.current = idx;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    const from = dragIdxRef.current;
    if (from === null || from === targetIdx) return;
    const updated = [...tasks];
    const [moved] = updated.splice(from, 1);
    updated.splice(targetIdx, 0, moved);
    dragIdxRef.current = null;
    updateTasks(updated);
  };

  const grouped = groupByCategory(tasks);

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-pichwai-brown">
            {completedCount}/{tasks.length} tasks complete
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {saving ? 'Saving…' : lastSaved
              ? `Saved at ${lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </p>
        </div>
        <span className="text-2xl font-bold text-pichwai-gold">{pct}%</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-pichwai-saffron to-pichwai-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Grouped task rows */}
      {Object.entries(grouped).map(([category, catTasks]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {getCategoryLabel(category)}
          </h4>
          <div className="space-y-1.5">
            {catTasks.map((task) => {
              const absIdx = tasks.indexOf(task);
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  absIdx={absIdx}
                  onToggle={(id) => updateTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))}
                  onDelete={(id) => updateTasks(tasks.filter((t) => t.id !== id))}
                  onNotesChange={(id, notes) => updateTasks(tasks.map((t) => t.id === id ? { ...t, notes } : t))}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-10 text-pichwai-brown/40">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm">No tasks yet. Add your first task below.</p>
        </div>
      )}

      {!readOnly && <AddTaskForm onAdd={(t) => updateTasks([...tasks, t])} />}
    </div>
  );
}
