'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import useSWR, { mutate as globalMutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Download, AlertTriangle, CheckCircle2, Receipt,
  TrendingUp, TrendingDown, X, Loader2, Edit2, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { fadeInUp, staggerContainer } from '@/lib/animations';

// ── helpers ──────────────────────────────────────────────────────────────────

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id:              string;
  category:        string;
  itemName:        string;
  estimatedAmount: string;
  actualAmount:    string | null;
  isPaid:          boolean;
  vendorId:        string | null;
  paymentId:       string | null;
  receiptUrl:      string | null;
  notes:           string | null;
  dueDate:         string | null;
  createdAt:       string;
}

interface AddItemForm {
  category:        string;
  itemName:        string;
  estimatedAmount: number;
  actualAmount:    number | '';
  notes:           string;
  dueDate:         string;
  vendorId:        string;
}

const BUDGET_CATEGORIES = [
  { value: 'venue',       label: 'Venue',           color: '#C9933A' },
  { value: 'catering',    label: 'Catering',         color: '#E07B39' },
  { value: 'photography', label: 'Photography',      color: '#D4A853' },
  { value: 'decoration',  label: 'Decoration',       color: '#7B9E3F' },
  { value: 'music',       label: 'Music / DJ',       color: '#4F86C6' },
  { value: 'mehendi',     label: 'Mehendi',          color: '#B85C8A' },
  { value: 'makeup',      label: 'Makeup',           color: '#D97B8A' },
  { value: 'transport',   label: 'Transport',        color: '#6B8E8A' },
  { value: 'invitation',  label: 'Invitations',      color: '#8B7355' },
  { value: 'vendor',      label: 'Vendor',           color: '#9B7B5A' },
  { value: 'other',       label: 'Other',            color: '#A0998B' },
];

function categoryColor(cat: string) {
  return BUDGET_CATEGORIES.find((c) => c.value === cat)?.color ?? '#A0998B';
}

// ── Donut Chart (pure SVG — no recharts dependency) ──────────────────────────

interface DonutSlice { value: number; color: string; label: string }

function DonutChart({ slices, total, center }: { slices: DonutSlice[]; total: number; center: string }) {
  const R = 60; const cx = 80; const cy = 80;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const paths = slices.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circ;
    const path = (
      <circle
        key={s.label}
        r={R}
        cx={cx}
        cy={cy}
        fill="none"
        stroke={s.color}
        strokeWidth={22}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.5s ease' }}
      />
    );
    offset += dash;
    return path;
  });

  return (
    <svg viewBox="0 0 160 160" className="h-36 w-36 drop-shadow-sm">
      <circle r={R} cx={cx} cy={cy} fill="none" stroke="#F4E4C1" strokeWidth={22} />
      {paths}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#3E2000" fontWeight="600">{center}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#8B6914">total</text>
    </svg>
  );
}

// ── fetcher ───────────────────────────────────────────────────────────────────

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

// ── main component ────────────────────────────────────────────────────────────

interface BudgetTrackerProps {
  eventId:     string;
  totalBudget: number;
  onBudgetUpdate?: (newBudget: number) => void;
}

export function BudgetTracker({ eventId, totalBudget, onBudgetUpdate }: BudgetTrackerProps) {
  const [showAdd, setShowAdd]     = useState(false);
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(totalBudget));
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const budgetKey = `/api/events/${eventId}/budget`;

  const { data, isLoading, mutate } = useSWR<{ items: BudgetItem[] }>(budgetKey, fetcher);
  const items = data?.items ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddItemForm>({
    defaultValues: { category: 'other', itemName: '', estimatedAmount: 0, actualAmount: '', notes: '', dueDate: '', vendorId: '' },
  });

  // ── Derived numbers ──────────────────────────────────────────────────────────

  const totalEstimated = items.reduce((s, i) => s + Number(i.estimatedAmount), 0);
  const totalActual    = items.reduce((s, i) => s + Number(i.actualAmount ?? 0), 0);
  const totalPaid      = items.filter((i) => i.isPaid).reduce((s, i) => s + Number(i.actualAmount ?? i.estimatedAmount), 0);
  const remaining      = totalBudget - totalActual;
  const overBudget     = totalActual > totalBudget;

  // Donut slices by category
  const categoryTotals = BUDGET_CATEGORIES.map((cat) => ({
    ...cat,
    value: items.filter((i) => i.category === cat.value).reduce((s, i) => s + Number(i.estimatedAmount), 0),
  })).filter((c) => c.value > 0);

  // Category overspend
  const categoryActuals = BUDGET_CATEGORIES.reduce<Record<string, { est: number; actual: number }>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat.value);
    acc[cat.value] = {
      est:    catItems.reduce((s, i) => s + Number(i.estimatedAmount), 0),
      actual: catItems.reduce((s, i) => s + Number(i.actualAmount ?? 0), 0),
    };
    return acc;
  }, {});

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function onAddItem(data: AddItemForm) {
    try {
      const res = await fetch(budgetKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          actualAmount: data.actualAmount === '' ? null : data.actualAmount,
        }),
      });
      if (!res.ok) throw new Error('Failed to add item');
      toast.success('Budget item added');
      reset();
      setShowAdd(false);
      mutate();
    } catch { toast.error('Failed to add item'); }
  }

  async function markPaid(item: BudgetItem) {
    try {
      await fetch(`${budgetKey}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !item.isPaid }),
      });
      mutate();
    } catch { toast.error('Update failed'); }
  }

  async function deleteItem(id: string) {
    try {
      await fetch(`${budgetKey}/${id}`, { method: 'DELETE' });
      toast.success('Item removed');
      mutate();
    } catch { toast.error('Delete failed'); }
  }

  async function uploadReceipt(file: File, itemId: string) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'receipts');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      await fetch(`${budgetKey}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: url }),
      });
      toast.success('Receipt uploaded');
      mutate();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function saveBudget() {
    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) { toast.error('Invalid budget amount'); return; }
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalBudget: val }),
      });
      onBudgetUpdate?.(val);
      setEditBudget(false);
      toast.success('Budget updated');
    } catch { toast.error('Update failed'); }
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.setTextColor(62, 32, 0);
      doc.text('Milap — Budget Report', 20, 25);

      doc.setFontSize(11);
      doc.setTextColor(139, 105, 20);
      doc.text(`Total Budget: ${inr(totalBudget)}`, 20, 35);
      doc.text(`Total Estimated: ${inr(totalEstimated)}`, 20, 42);
      doc.text(`Total Actual Spend: ${inr(totalActual)}`, 20, 49);
      doc.text(`Remaining: ${inr(remaining)}`, 20, 56);

      doc.setDrawColor(201, 147, 58);
      doc.line(20, 62, 190, 62);

      // Table headers
      doc.setFontSize(10);
      doc.setTextColor(62, 32, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Category',  20, 70);
      doc.text('Item',      60, 70);
      doc.text('Estimated', 120, 70);
      doc.text('Actual',    150, 70);
      doc.text('Paid',      178, 70);
      doc.setFont('helvetica', 'normal');

      let y = 78;
      items.forEach((item) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(100, 60, 20);
        doc.text(item.category,                           20, y, { maxWidth: 38 });
        doc.text(item.itemName,                           60, y, { maxWidth: 56 });
        doc.text(inr(Number(item.estimatedAmount)),      120, y);
        doc.text(inr(Number(item.actualAmount ?? 0)),   150, y);
        doc.text(item.isPaid ? '✓' : '—',              178, y);
        y += 8;
      });

      doc.setFontSize(8);
      doc.setTextColor(139, 105, 20);
      doc.text(`Generated by Milap — ${new Date().toLocaleDateString('en-IN')}`, 20, 285);

      doc.save(`event-${eventId.slice(0, 8)}-budget.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting(false);
    }
  }

  const INPUT = 'w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none';
  const LABEL = 'mb-1 block text-xs font-medium text-pichwai-brown-600';

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary cards ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: 'Total Budget',
            value: totalBudget,
            sub:   editBudget ? null : 'tap to edit',
            icon: <Edit2 className="h-4 w-4" />,
            color: 'border-pichwai-gold-200',
            onClick: () => setEditBudget(true),
          },
          {
            label: 'Estimated',
            value: totalEstimated,
            sub:   totalEstimated > totalBudget ? '⚠ Over budget' : `${inr(totalBudget - totalEstimated)} available`,
            icon: totalEstimated > totalBudget ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />,
            color: totalEstimated > totalBudget ? 'border-red-200' : 'border-green-200',
          },
          {
            label: 'Actual Spent',
            value: totalActual,
            sub:   `${items.filter((i) => i.isPaid).length} items paid`,
            icon: <CheckCircle2 className="h-4 w-4 text-pichwai-gold-500" />,
            color: overBudget ? 'border-red-200' : 'border-pichwai-gold-200',
          },
          {
            label: 'Remaining',
            value: remaining,
            sub:   overBudget ? '⚠ Over budget!' : 'budget left',
            icon: overBudget ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null,
            color: overBudget ? 'border-red-200 bg-red-50' : 'border-pichwai-gold-200',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            variants={fadeInUp}
            onClick={card.onClick}
            className={cn(
              'rounded-2xl border bg-white p-5 shadow-sm',
              card.color,
              card.onClick && 'cursor-pointer hover:shadow-md transition-shadow',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-pichwai-brown-500">{card.label}</p>
              {card.icon}
            </div>
            {editBudget && card.label === 'Total Budget' ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full rounded-lg border border-pichwai-gold-300 bg-pichwai-cream-50 px-2 py-1 text-lg font-bold focus:outline-none"
                  autoFocus
                />
                <button onClick={saveBudget} className="rounded-lg bg-pichwai-gold-500 px-2 py-1 text-xs text-white">✓</button>
                <button onClick={() => setEditBudget(false)} className="text-pichwai-brown-400"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <p className={cn('mt-2 text-2xl font-bold', overBudget && card.label === 'Remaining' ? 'text-red-600' : 'text-pichwai-brown-900')}>
                {inr(card.value)}
              </p>
            )}
            {card.sub && <p className="mt-0.5 text-xs text-pichwai-brown-400">{card.sub}</p>}
          </motion.div>
        ))}
      </motion.div>

      {/* ── Chart + Category breakdown ── */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Donut */}
        <div className="flex items-center justify-center rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm lg:w-64">
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              slices={categoryTotals}
              total={totalEstimated}
              center={inr(totalEstimated).replace('₹', '')}
            />
            <div className="flex flex-wrap justify-center gap-2">
              {categoryTotals.map((c) => (
                <span key={c.value} className="flex items-center gap-1 text-xs text-pichwai-brown-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div className="flex-1 grid gap-3 sm:grid-cols-2">
          {BUDGET_CATEGORIES.filter((c) => categoryActuals[c.value]?.est > 0 || categoryActuals[c.value]?.actual > 0).map((cat) => {
            const { est, actual } = categoryActuals[cat.value];
            const over = actual > est * 1.1;
            return (
              <div key={cat.value} className={cn('rounded-xl border bg-white p-4 shadow-sm', over ? 'border-red-200' : 'border-pichwai-gold-100')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-pichwai-brown-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                    {cat.label}
                  </span>
                  {over && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-pichwai-cream-200 mb-2">
                  <div
                    className={cn('h-full rounded-full transition-all', over ? 'bg-red-400' : 'bg-pichwai-gold-400')}
                    style={{ width: `${Math.min((actual / Math.max(est, 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-pichwai-brown-500">
                  <span>Est: {inr(est)}</span>
                  <span className={over ? 'font-semibold text-red-600' : ''}>Act: {inr(actual)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Items table ── */}
      <div className="rounded-2xl border border-pichwai-gold-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-pichwai-gold-100 px-6 py-4">
          <h3 className="font-playfair text-lg font-semibold text-pichwai-brown-800">Budget Items</h3>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-pichwai-gold-200 px-3 py-1.5 text-xs font-medium text-pichwai-brown-600 hover:bg-pichwai-cream-50 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export PDF
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-pichwai-gold-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-pichwai-brown-400">
            <Receipt className="h-10 w-10 text-pichwai-gold-200" />
            <p className="text-sm">No budget items yet. Add your first expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pichwai-gold-50 bg-pichwai-cream-50">
                  {['Category', 'Item', 'Estimated', 'Actual', 'Paid', 'Receipt', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-pichwai-brown-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const actual  = Number(item.actualAmount ?? 0);
                  const est     = Number(item.estimatedAmount);
                  const isOver  = actual > est * 1.1;
                  return (
                    <tr
                      key={item.id}
                      className={cn('border-b border-pichwai-gold-50 hover:bg-pichwai-cream-50/50', i % 2 === 0 ? '' : 'bg-pichwai-cream-50/30')}
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(item.category) }} />
                          <span className="capitalize text-pichwai-brown-600">{item.category}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-pichwai-brown-800 max-w-[160px] truncate">{item.itemName}</td>
                      <td className="px-4 py-3 text-pichwai-brown-600">{inr(est)}</td>
                      <td className={cn('px-4 py-3 font-medium', isOver ? 'text-red-600' : 'text-pichwai-brown-700')}>
                        {actual > 0 ? inr(actual) : '—'}
                        {isOver && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-red-500" />}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => markPaid(item)}
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium transition',
                            item.isPaid
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-pichwai-cream-200 text-pichwai-brown-500 hover:bg-pichwai-cream-300',
                          )}
                        >
                          {item.isPaid ? '✓ Paid' : 'Mark Paid'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {item.receiptUrl ? (
                          <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="text-pichwai-gold-600 hover:underline text-xs">
                            View
                          </a>
                        ) : (
                          <label className="cursor-pointer text-xs text-pichwai-brown-400 hover:text-pichwai-gold-600">
                            Upload
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*,.pdf"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(f, item.id); }}
                            />
                          </label>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteItem(item.id)} className="text-red-300 hover:text-red-500 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-pichwai-gold-200 bg-pichwai-cream-50 font-semibold">
                  <td colSpan={2} className="px-4 py-3 text-pichwai-brown-700">Totals</td>
                  <td className="px-4 py-3 text-pichwai-brown-700">{inr(totalEstimated)}</td>
                  <td className={cn('px-4 py-3', overBudget ? 'text-red-600' : 'text-pichwai-brown-700')}>{inr(totalActual)}</td>
                  <td colSpan={3} className="px-4 py-3 text-xs text-pichwai-brown-400">
                    {inr(totalPaid)} paid of {inr(totalActual)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Expense Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowAdd(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-playfair text-lg font-semibold text-pichwai-brown-800">Add Expense</h3>
                <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-pichwai-brown-400" /></button>
              </div>

              <form onSubmit={handleSubmit(onAddItem)} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Category *</label>
                    <select {...register('category', { required: true })} className={INPUT}>
                      {BUDGET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Item Name *</label>
                    <input {...register('itemName', { required: true })} className={INPUT} placeholder="Flower decoration" />
                  </div>
                  <div>
                    <label className={LABEL}>Estimated Amount (₹) *</label>
                    <input {...register('estimatedAmount', { required: true, min: 0 })} type="number" className={INPUT} placeholder="50000" />
                  </div>
                  <div>
                    <label className={LABEL}>Actual Amount (₹)</label>
                    <input {...register('actualAmount')} type="number" className={INPUT} placeholder="Leave blank if not spent yet" />
                  </div>
                  <div>
                    <label className={LABEL}>Due Date</label>
                    <input {...register('dueDate')} type="date" className={INPUT} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Notes</label>
                    <input {...register('notes')} className={INPUT} placeholder="Optional notes" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 rounded-xl border border-pichwai-gold-200 py-2.5 text-sm text-pichwai-brown-600 hover:bg-pichwai-cream-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90">
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
