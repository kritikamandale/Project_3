'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Wallet, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  estimatedAmount: string;
  actualAmount?: string;
  isPaid: boolean;
  notes?: string;
  dueDate?: string;
}

interface EventBrief {
  title: string;
  totalBudget: string;
  spentBudget: string;
}

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('fetch failed');
    return r.json() as Promise<{ event: EventBrief; budgetItems: BudgetItem[] }>;
  });

export default function BudgetPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ category: '', itemName: '', estimatedAmount: '', notes: '' });
  const [saving, setSaving]     = useState(false);

  const { data, isLoading: loading, mutate } = useSWR(
    `/api/events/${eventId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const event = data?.event ?? null;
  const [localItems, setLocalItems] = useState<BudgetItem[] | null>(null);
  const items = localItems ?? data?.budgetItems ?? [];

  const totalEstimated = items.reduce((s, i) => s + Number(i.estimatedAmount), 0);
  const totalActual    = items.reduce((s, i) => s + Number(i.actualAmount ?? 0), 0);
  const totalBudget    = Number(event?.totalBudget ?? 0);
  const remaining      = totalBudget - totalActual;
  const budgetPct      = totalBudget > 0 ? Math.min(100, (totalActual / totalBudget) * 100) : 0;

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  async function addItem() {
    if (!form.itemName || !form.estimatedAmount) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, estimatedAmount: Number(form.estimatedAmount) }),
      });
      if (res.ok) {
        const { item } = await res.json() as { item: BudgetItem };
        setLocalItems((prev) => [...(prev ?? data?.budgetItems ?? []), item]);
        setForm({ category: '', itemName: '', estimatedAmount: '', notes: '' });
        setShowForm(false);
        mutate();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Budget</h1>
          {event && <p className="text-sm text-[var(--muted-fg)] mt-1">{event.title}</p>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget',  value: formatCurrency(totalBudget),    color: 'text-[var(--pichwai-gold)]' },
          { label: 'Estimated',     value: formatCurrency(totalEstimated),  color: 'text-blue-600' },
          { label: 'Spent',         value: formatCurrency(totalActual),     color: 'text-orange-500' },
          { label: 'Remaining',     value: formatCurrency(Math.max(0, remaining)), color: remaining >= 0 ? 'text-green-600' : 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted-fg)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {totalBudget > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-[var(--pichwai-mid-brown)] flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--pichwai-gold)]" /> Budget Usage
            </span>
            <span className="text-[var(--muted-fg)]">{budgetPct.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${budgetPct > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B]'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          {budgetPct > 90 && (
            <p className="text-xs text-red-500 mt-2">⚠️ Over 90% of budget used</p>
          )}
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)] mb-4">Add Budget Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Category</label>
              <input
                type="text"
                placeholder="e.g. Catering, Flowers"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Buffet for 200 guests"
                value={form.itemName}
                onChange={(e) => setForm((p) => ({ ...p, itemName: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Estimated Amount (₹) *</label>
              <input
                type="number"
                placeholder="50000"
                value={form.estimatedAmount}
                onChange={(e) => setForm((p) => ({ ...p, estimatedAmount: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-fg)] mb-1 block">Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addItem}
              disabled={saving || !form.itemName || !form.estimatedAmount}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Item'}
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

      {/* Items table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--pichwai-mid-brown)]">
            Budget Items {items.length > 0 && <span className="text-[var(--muted-fg)] font-normal">({items.length})</span>}
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--muted-fg)]">No budget items yet. Add your first expense.</p>
          </div>
        ) : (
          <>
            {categories.length > 0 && categories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              const catTotal = catItems.reduce((s, i) => s + Number(i.estimatedAmount), 0);
              return (
                <div key={cat}>
                  <div className="px-6 py-2 bg-[rgba(201,147,58,0.05)] border-b border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">{cat}</span>
                    <span className="ml-2 text-xs text-[var(--muted-fg)]">{formatCurrency(catTotal)}</span>
                  </div>
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[rgba(201,147,58,0.03)] transition">
                      <div className="shrink-0 text-[var(--pichwai-gold)]">
                        {item.isPaid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 opacity-40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.itemName}</p>
                        {item.notes && <p className="text-xs text-[var(--muted-fg)] truncate">{item.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[var(--pichwai-gold-deep)]">{formatCurrency(item.estimatedAmount)}</p>
                        {item.actualAmount && Number(item.actualAmount) > 0 && (
                          <p className="text-xs text-[var(--muted-fg)]">actual: {formatCurrency(item.actualAmount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Items with no category */}
            {items.filter((i) => !i.category).map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[rgba(201,147,58,0.03)] transition">
                <div className="shrink-0">
                  {item.isPaid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-[var(--muted-fg)] opacity-40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.itemName}</p>
                  {item.notes && <p className="text-xs text-[var(--muted-fg)] truncate">{item.notes}</p>}
                </div>
                <p className="text-sm font-semibold text-[var(--pichwai-gold-deep)] shrink-0">{formatCurrency(item.estimatedAmount)}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
