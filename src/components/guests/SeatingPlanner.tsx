'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type TableShape = 'round' | 'rectangular' | 'cocktail';

interface SeatingTable {
  id: string;
  label: string;
  shape: TableShape;
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

interface Props {
  eventId: string;
  guests: GuestOption[];
  initialTables?: SeatingTable[];
  initialSeats?: GuestSeat[];
  onSave?: (tables: SeatingTable[], seats: GuestSeat[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getCsrfToken() {
  return typeof window !== 'undefined'
    ? document.cookie.split('; ').find((r) => r.startsWith('milap_csrf='))?.split('=')[1]
    : undefined;
}

const SHAPE_ICONS: Record<TableShape, string> = {
  round:       '⬤',
  rectangular: '▬',
  cocktail:    '🍸',
};

const SHAPE_LABELS: Record<TableShape, string> = {
  round:       'Round',
  rectangular: 'Rectangular',
  cocktail:    'Cocktail',
};

// ─── Table shape renderer ─────────────────────────────────────────────────────

function TableShape({
  table,
  seated,
  isOver,
  selected,
  onClick,
  onDrop,
}: {
  table: SeatingTable;
  seated: GuestSeat[];
  isOver: boolean;
  selected: boolean;
  onClick: () => void;
  onDrop: (guestId: string, guestName: string) => void;
}) {
  const pct   = seated.length / table.capacity;
  const color = pct >= 1 ? 'border-red-400 bg-red-50' : pct >= 0.8 ? 'border-amber-400 bg-amber-50' : 'border-pichwai-gold bg-white';

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop     = (e: React.DragEvent) => {
    e.preventDefault();
    const id   = e.dataTransfer.getData('guestId');
    const name = e.dataTransfer.getData('guestName');
    if (id) onDrop(id, name);
  };

  const shapeClass = {
    round:       'rounded-full',
    rectangular: 'rounded-xl',
    cocktail:    'rounded-2xl',
  }[table.shape];

  const size = table.shape === 'cocktail' ? 'w-16 h-16' : 'w-24 h-24';

  return (
    <div
      className="absolute flex flex-col items-center gap-1 cursor-pointer select-none"
      style={{ left: table.x, top: table.y }}
      onClick={onClick}
    >
      <motion.div
        className={cn(
          'border-2 flex flex-col items-center justify-center transition-colors',
          size,
          shapeClass,
          color,
          isOver && 'ring-2 ring-pichwai-gold ring-offset-2',
          selected && 'ring-2 ring-pichwai-saffron ring-offset-1',
        )}
        whileHover={{ scale: 1.05 }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="text-lg">{SHAPE_ICONS[table.shape]}</span>
        <span className="text-xs font-semibold text-pichwai-brown">{table.label}</span>
        <span className={cn('text-xs', pct >= 1 ? 'text-red-600' : 'text-gray-500')}>
          {seated.length}/{table.capacity}
        </span>
      </motion.div>
    </div>
  );
}

// ─── Guest chip in the side panel ────────────────────────────────────────────

function GuestChip({ guest, onRemove }: { guest: GuestSeat; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-white rounded-lg border border-gray-100 text-xs group">
      <span className="text-gray-800 truncate max-w-[110px]">{guest.guestName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main SeatingPlanner ──────────────────────────────────────────────────────

export default function SeatingPlanner({
  eventId,
  guests,
  initialTables = [],
  initialSeats  = [],
  onSave,
}: Props) {
  const [tables,   setTables]   = useState<SeatingTable[]>(initialTables);
  const [seats,    setSeats]    = useState<GuestSeat[]>(initialSeats);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [addForm,  setAddForm]  = useState(false);
  const [newTable, setNewTable] = useState<{ label: string; shape: TableShape; capacity: string }>({
    label: '', shape: 'round', capacity: '8',
  });
  const [dragging, setDragging] = useState<{ guestId: string; fromTable: string | null } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragPos   = useRef<{ x: number; y: number } | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────

  const unassigned = useMemo(
    () => guests.filter(
      (g) => g.rsvpStatus === 'confirmed' && !seats.find((s) => s.guestId === g.id),
    ),
    [guests, seats],
  );

  const seatedByTable = useCallback(
    (tableId: string) => seats.filter((s) => s.tableId === tableId),
    [seats],
  );

  // ── Add / remove tables ───────────────────────────────────────────────────

  const addTable = () => {
    if (!newTable.label.trim()) return;
    const cap = parseInt(newTable.capacity, 10) || 8;
    setTables((prev) => [
      ...prev,
      { id: uid(), label: newTable.label, shape: newTable.shape, capacity: cap, x: 40 + prev.length * 140, y: 40 },
    ]);
    setNewTable({ label: '', shape: 'round', capacity: '8' });
    setAddForm(false);
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setSeats((prev) => prev.filter((s) => s.tableId !== id));
    if (selected === id) setSelected(null);
  };

  // ── Drag from unassigned panel → canvas table ─────────────────────────────

  const handleGuestDragStart = (
    e: React.DragEvent,
    guestId: string,
    guestName: string,
    fromTable: string | null,
  ) => {
    e.dataTransfer.setData('guestId',   guestId);
    e.dataTransfer.setData('guestName', guestName);
    e.dataTransfer.effectAllowed = 'move';
    setDragging({ guestId, fromTable });
  };

  const assignGuest = useCallback((guestId: string, guestName: string, tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const current = seats.filter((s) => s.tableId === tableId);
    if (current.length >= table.capacity) return; // capacity guard

    setSeats((prev) => {
      const without = prev.filter((s) => s.guestId !== guestId);
      return [...without, { guestId, guestName, tableId }];
    });
    setDragging(null);
  }, [tables, seats]);

  const removeGuest = useCallback((guestId: string) => {
    setSeats((prev) => prev.filter((s) => s.guestId !== guestId));
  }, []);

  // ── Table drag (repositioning on canvas) ─────────────────────────────────

  const tableMouseDown = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    const orig  = tables.find((t) => t.id === id)!;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      setTables((prev) =>
        prev.map((t) => t.id === id ? { ...t, x: Math.max(0, orig.x + dx), y: Math.max(0, orig.y + dy) } : t),
      );
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  // ── Auto-assign ───────────────────────────────────────────────────────────

  const autoAssign = () => {
    const unass = guests.filter(
      (g) => g.rsvpStatus === 'confirmed' && !seats.find((s) => s.guestId === g.id),
    );
    if (!unass.length) return;

    const newSeats = [...seats];
    for (const g of unass) {
      const t = tables.find((t) => newSeats.filter((s) => s.tableId === t.id).length < t.capacity);
      if (!t) break;
      newSeats.push({ guestId: g.id, guestName: g.fullName, tableId: t.id });
    }
    setSeats(newSeats);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      if (onSave) {
        onSave(tables, seats);
      } else {
        const csrf = getCsrfToken();
        await fetch(`/api/events/${eventId}/seating`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
          body:    JSON.stringify({ tables, seats }),
        });
      }
      setSavedMsg('Seating plan saved ✓');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const { default: jsPDF }       = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas  = await html2canvas(canvasRef.current, { scale: 1.5 });
    const img     = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height + 40] });
    pdf.setFontSize(14);
    pdf.text('Seating Plan', 20, 24);
    pdf.addImage(img, 'PNG', 0, 36, canvas.width, canvas.height);
    pdf.save('seating-plan.pdf');
  };

  const selectedTable = tables.find((t) => t.id === selected);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">

      {/* Side panel: unassigned guests */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-pichwai-brown">Unassigned</h3>
            <span className="text-xs text-gray-400">{unassigned.length} guests</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {unassigned.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-4">All confirmed guests seated 🎉</p>
            )}
            {unassigned.map((g) => (
              <div
                key={g.id}
                draggable
                onDragStart={(e) => handleGuestDragStart(e, g.id, g.fullName, null)}
                className="flex items-center gap-2 px-3 py-2 bg-pichwai-gold/5 rounded-xl text-sm text-gray-800 cursor-grab active:cursor-grabbing hover:bg-pichwai-gold/10 transition-colors border border-pichwai-gold/20"
              >
                <span className="text-xs opacity-40">⠿</span>
                <span className="truncate">{g.fullName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected table details */}
        <AnimatePresence>
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={  { opacity: 0, y: 8 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-pichwai-brown">{selectedTable.label}</h4>
                <button
                  type="button"
                  onClick={() => deleteTable(selectedTable.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete table
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {SHAPE_LABELS[selectedTable.shape]} · {seatedByTable(selectedTable.id).length}/{selectedTable.capacity} seats
              </p>
              <div className="space-y-1">
                {seatedByTable(selectedTable.id).map((s) => (
                  <GuestChip
                    key={s.guestId}
                    guest={s}
                    onRemove={() => removeGuest(s.guestId)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setAddForm((v) => !v)}
            className="px-4 py-2 rounded-xl bg-pichwai-gold text-white text-sm font-semibold hover:bg-pichwai-saffron transition-colors"
          >
            + Add Table
          </button>
          <button
            type="button"
            onClick={autoAssign}
            disabled={!unassigned.length || !tables.length}
            className="px-4 py-2 rounded-xl border border-pichwai-gold text-pichwai-brown text-sm hover:bg-pichwai-gold/10 disabled:opacity-40 transition-colors"
          >
            ✨ Auto-Assign
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            📄 Export PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ml-auto px-5 py-2 rounded-xl bg-pichwai-brown text-white text-sm font-semibold hover:bg-pichwai-brown/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Plan'}
          </button>
          {savedMsg && <span className="text-xs text-green-600">{savedMsg}</span>}
        </div>

        {/* Add table form */}
        <AnimatePresence>
          {addForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={  { height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-end gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Table Name</span>
                  <input
                    value={newTable.label}
                    onChange={(e) => setNewTable((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Table 1"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/30 w-36"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Shape</span>
                  <select
                    value={newTable.shape}
                    onChange={(e) => setNewTable((f) => ({ ...f, shape: e.target.value as TableShape }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
                  >
                    {(Object.keys(SHAPE_LABELS) as TableShape[]).map((s) => (
                      <option key={s} value={s}>{SHAPE_LABELS[s]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Capacity</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newTable.capacity}
                    onChange={(e) => setNewTable((f) => ({ ...f, capacity: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none w-20"
                  />
                </label>
                <button
                  type="button"
                  onClick={addTable}
                  className="px-4 py-2 rounded-xl bg-pichwai-gold text-white text-sm font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative bg-pichwai-cream/30 rounded-2xl border-2 border-dashed border-pichwai-gold/30 overflow-hidden"
          style={{ minHeight: 400 }}
          onDragOver={(e) => e.preventDefault()}
        >
          {tables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
              <div className="text-4xl mb-3">🪑</div>
              <p className="text-sm text-pichwai-brown">Add a table to start planning your seating</p>
            </div>
          )}

          {tables.map((t) => (
            <div
              key={t.id}
              onMouseDown={(e) => tableMouseDown(e, t.id)}
              onClick={() => setSelected((id) => id === t.id ? null : t.id)}
            >
              <TableShape
                table={t}
                seated={seatedByTable(t.id)}
                isOver={dragOver === t.id}
                selected={selected === t.id}
                onClick={() => {}}
                onDrop={(guestId, guestName) => {
                  assignGuest(guestId, guestName, t.id);
                  setDragOver(null);
                }}
              />
            </div>
          ))}
        </div>

        {/* Capacity warning */}
        {tables.some((t) => seatedByTable(t.id).length >= t.capacity) && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">
            ⚠️ Some tables are at or over capacity — shown in red
          </p>
        )}
      </div>
    </div>
  );
}
