'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { RSVP_STATUSES, MEAL_PREFS } from '@/lib/validators/guest.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GuestRow = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  rsvpStatus: string;
  mealPreference?: string | null;
  tableNumber?: number | null;
  groupName?: string | null;
  isVip: boolean;
  inviteSentAt?: string | null;
  checkInAt?: string | null;
};

interface Props {
  eventId: string;
  guests: GuestRow[];
  onRefresh: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RSVP_BADGE: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-800' },
  declined:  { label: 'Declined',  cls: 'bg-red-100 text-red-700'    },
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800' },
  maybe:     { label: 'Maybe',     cls: 'bg-blue-100 text-blue-700'   },
};

function getCsrfToken() {
  return typeof window !== 'undefined'
    ? document.cookie.split('; ').find((r) => r.startsWith('milap_csrf='))?.split('=')[1]
    : undefined;
}

// ─── Manual CSV parser (no PapaParse) ─────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportCSV(rows: GuestRow[]) {
  const header = 'Name,Email,Phone,RSVP,Meal,Table,Group,VIP,Invite Sent,Checked In\n';
  const body = rows
    .map((g) =>
      [
        `"${g.fullName}"`,
        g.email ?? '',
        g.phone ?? '',
        g.rsvpStatus,
        g.mealPreference ?? '',
        g.tableNumber ?? '',
        g.groupName ?? '',
        g.isVip ? 'Yes' : 'No',
        g.inviteSentAt ? new Date(g.inviteSentAt).toLocaleDateString('en-IN') : '',
        g.checkInAt    ? new Date(g.checkInAt).toLocaleTimeString('en-IN')    : '',
      ].join(','),
    )
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'guests.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(tableEl: HTMLTableElement | null) {
  if (!tableEl) return;
  const { default: jsPDF }       = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');
  const canvas  = await html2canvas(tableEl, { scale: 1.5 });
  const imgData = canvas.toDataURL('image/png');
  const pdf     = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height + 40] });
  pdf.setFontSize(14);
  pdf.text('Guest List', 20, 24);
  pdf.addImage(imgData, 'PNG', 0, 36, canvas.width, canvas.height);
  pdf.save('guests.pdf');
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function GuestModal({
  eventId,
  guest,
  onClose,
  onSaved,
}: {
  eventId: string;
  guest: GuestRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!guest;
  const [form, setForm] = useState({
    fullName:       guest?.fullName       ?? '',
    email:          guest?.email          ?? '',
    phone:          guest?.phone          ?? '',
    rsvpStatus:     guest?.rsvpStatus     ?? 'pending',
    mealPreference: guest?.mealPreference ?? '',
    tableNumber:    String(guest?.tableNumber ?? ''),
    groupName:      guest?.groupName      ?? '',
    isVip:          guest?.isVip          ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    const csrf = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    };
    const payload = {
      ...form,
      tableNumber:    form.tableNumber ? parseInt(form.tableNumber, 10) : undefined,
      mealPreference: form.mealPreference || undefined,
      email:          form.email          || undefined,
      phone:          form.phone          || undefined,
      groupName:      form.groupName      || undefined,
    };

    try {
      const res = isEdit
        ? await fetch(`/api/events/${eventId}/guests/${guest.id}`, { method: 'PATCH', headers, body: JSON.stringify(payload) })
        : await fetch(`/api/events/${eventId}/guests`,             { method: 'POST',  headers, body: JSON.stringify(payload) });

      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Failed to save');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={  { scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <h3 className="font-playfair text-lg font-bold text-pichwai-brown mb-4">
          {isEdit ? 'Edit Guest' : 'Add Guest'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">

          <div className="col-span-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Full Name *</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/30"
              />
            </label>
          </div>

          {[
            { label: 'Email',         key: 'email'          as const, type: 'email'  },
            { label: 'Phone',         key: 'phone'          as const, type: 'tel'    },
            { label: 'Group Name',    key: 'groupName'      as const, type: 'text'   },
            { label: 'Table Number',  key: 'tableNumber'    as const, type: 'number' },
          ].map(({ label, key, type }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{label}</span>
              <input
                type={type}
                value={String(form[key])}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/30"
              />
            </label>
          ))}

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">RSVP Status</span>
            <select
              value={form.rsvpStatus}
              onChange={(e) => setForm((f) => ({ ...f, rsvpStatus: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
            >
              {RSVP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Meal Preference</span>
            <select
              value={form.mealPreference}
              onChange={(e) => setForm((f) => ({ ...f, mealPreference: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
            >
              <option value="">— none —</option>
              {MEAL_PREFS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={form.isVip}
              onChange={(e) => setForm((f) => ({ ...f, isVip: e.target.checked }))}
              className="w-4 h-4 accent-pichwai-gold"
            />
            <span className="text-sm text-gray-600">Mark as VIP ⭐</span>
          </label>

          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}

          <div className="col-span-2 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-pichwai-gold text-white text-sm font-semibold hover:bg-pichwai-saffron disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Guest'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

function CSVImportModal({
  eventId,
  onClose,
  onImported,
}: {
  eventId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [rows,   setRows]   = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text   = ev.target?.result as string;
      const parsed = parseCSV(text);
      const errs: string[] = [];
      parsed.forEach((r, i) => {
        if (!r.name && !r.fullname) errs.push(`Row ${i + 2}: missing name column`);
      });
      setErrors(errs);
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rows.length || errors.length) return;
    setSaving(true);
    const csrf = getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    };
    for (const row of rows) {
      const fullName = row.name ?? row.fullname ?? '';
      if (!fullName) continue;
      await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName,
          email:          row.email          || undefined,
          phone:          row.phone          || undefined,
          groupName:      row.group          || row.groupname      || undefined,
          mealPreference: row.meal           || row.mealpreference || undefined,
        }),
      });
    }
    setSaving(false);
    onImported();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={  { scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6"
      >
        <h3 className="font-playfair text-lg font-bold text-pichwai-brown mb-2">
          Import from CSV
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Expected columns: <code className="bg-gray-100 px-1 rounded">name, email, phone, group, meal</code>
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pichwai-gold/10 file:text-pichwai-brown hover:file:bg-pichwai-gold/20"
        />

        {errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-red-700 space-y-1">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {rows.length > 0 && errors.length === 0 && (
          <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0">
                <tr>
                  {Object.keys(rows[0]).slice(0, 5).map((h) => (
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {Object.values(r).slice(0, 5).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p className="text-center py-2 text-xs text-gray-400">
                …and {rows.length - 10} more rows
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!rows.length || saving || errors.length > 0}
            className="flex-1 py-2.5 rounded-xl bg-pichwai-gold text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Importing…' : `Import ${rows.length} guest${rows.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main GuestTable ──────────────────────────────────────────────────────────

export default function GuestTable({ eventId, guests: initialGuests, onRefresh }: Props) {
  const [data, setData]                 = useState<GuestRow[]>(initialGuests);
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobal]       = useState('');
  const [rsvpFilter,   setRsvp]         = useState('');
  const [groupFilter,  setGroup]        = useState('');
  const [checkinFilter, setCheckin]     = useState('');
  const [editGuest,    setEdit]         = useState<GuestRow | null | 'new'>(null);
  const [showImport,   setImport]       = useState(false);
  const [sendingInvites, setSending]    = useState(false);
  const [bulkMsg,      setBulkMsg]      = useState('');
  const tableRef = useRef<HTMLTableElement>(null);

  React.useEffect(() => { setData(initialGuests); }, [initialGuests]);

  const selectedIds = useMemo(
    () =>
      Object.keys(rowSelection)
        .map((idx) => data[parseInt(idx, 10)]?.id)
        .filter(Boolean) as string[],
    [rowSelection, data],
  );

  // ── Column definitions ───────────────────────────────────────────────────

  const col = createColumnHelper<GuestRow>();

  const columns = useMemo(() => [
    col.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 accent-pichwai-gold rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-pichwai-gold rounded"
        />
      ),
    }),

    col.accessor('fullName', {
      header: 'Name',
      cell: (info) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-pichwai-gold/20 text-pichwai-brown text-xs font-bold flex items-center justify-center flex-shrink-0">
            {info.getValue().slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900">{info.getValue()}</span>
              {info.row.original.isVip && <span className="text-xs">⭐</span>}
            </div>
            {info.row.original.groupName && (
              <div className="text-xs text-gray-400">{info.row.original.groupName}</div>
            )}
          </div>
        </div>
      ),
    }),

    col.display({
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-[160px]">
          {row.original.email && <div className="truncate">{row.original.email}</div>}
          {row.original.phone && (
            <div className="text-xs text-gray-400">{row.original.phone}</div>
          )}
        </div>
      ),
    }),

    col.accessor('rsvpStatus', {
      header: 'RSVP',
      cell: (info) => {
        const b = RSVP_BADGE[info.getValue()] ?? { label: info.getValue(), cls: 'bg-gray-100 text-gray-700' };
        return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', b.cls)}>{b.label}</span>;
      },
    }),

    col.accessor('mealPreference', {
      header: 'Meal',
      cell: (info) => <span className="text-xs text-gray-500">{info.getValue() ?? '—'}</span>,
    }),

    col.accessor('tableNumber', {
      header: 'Table',
      cell: (info) => (
        <span className="text-sm text-gray-700">
          {info.getValue() != null ? `#${info.getValue()}` : '—'}
        </span>
      ),
    }),

    col.accessor('inviteSentAt', {
      header: 'Invite',
      cell: (info) => (
        <span className={cn('text-xs', info.getValue() ? 'text-green-600' : 'text-gray-400')}>
          {info.getValue()
            ? new Date(info.getValue()!).toLocaleDateString('en-IN')
            : 'Not sent'}
        </span>
      ),
    }),

    col.accessor('checkInAt', {
      header: 'Check-in',
      cell: (info) => (
        <span className={cn('text-xs', info.getValue() ? 'text-green-600 font-medium' : 'text-gray-400')}>
          {info.getValue()
            ? new Date(info.getValue()!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      ),
    }),

    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setEdit(row.original)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-pichwai-brown transition-colors text-base"
            title="Edit"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => handleResendInvite([row.original.id])}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-pichwai-brown transition-colors text-base"
            title="Resend Invite"
          >
            📨
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors text-base"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      ),
    }),
  ], []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this guest?')) return;
    const csrf = getCsrfToken();
    await fetch(`/api/events/${eventId}/guests/${id}`, {
      method:  'DELETE',
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    });
    setData((prev) => prev.filter((g) => g.id !== id));
  }, [eventId]);

  const handleResendInvite = useCallback(async (ids: string[]) => {
    setSending(true);
    setBulkMsg('');
    const csrf = getCsrfToken();
    try {
      const res = await fetch(`/api/events/${eventId}/guests/send-invites`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body:    JSON.stringify({ guestIds: ids, channels: ['email', 'whatsapp'] }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setBulkMsg(d.error ?? 'Failed to send invites');
      } else {
        const d = await res.json() as { sent: number };
        setBulkMsg(`✓ ${d.sent} invite(s) sent`);
        const now = new Date().toISOString();
        setData((prev) => prev.map((g) => ids.includes(g.id) ? { ...g, inviteSentAt: now } : g));
      }
    } finally {
      setSending(false);
    }
  }, [eventId]);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} guest(s)?`)) return;
    const csrf = getCsrfToken();
    await Promise.allSettled(
      selectedIds.map((id) =>
        fetch(`/api/events/${eventId}/guests/${id}`, {
          method: 'DELETE',
          headers: csrf ? { 'x-csrf-token': csrf } : {},
        }),
      ),
    );
    setData((prev) => prev.filter((g) => !selectedIds.includes(g.id)));
    setRowSelection({});
  };

  // ── Filtered data (manual filters stacked before table global filter) ────

  const filteredData = useMemo(() => {
    let d = data;
    if (rsvpFilter)                 d = d.filter((g) => g.rsvpStatus === rsvpFilter);
    if (groupFilter)                d = d.filter((g) => g.groupName  === groupFilter);
    if (checkinFilter === 'checked')    d = d.filter((g) => !!g.checkInAt);
    if (checkinFilter === 'unchecked')  d = d.filter((g) => !g.checkInAt);
    return d;
  }, [data, rsvpFilter, groupFilter, checkinFilter]);

  const table = useReactTable({
    data:         filteredData,
    columns,
    state:        { sorting, rowSelection, globalFilter },
    onSortingChange:      setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobal,
    getCoreRowModel:     getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel:   getSortedRowModel(),
  });

  const groups = useMemo(
    () => [...new Set(data.map((g) => g.groupName).filter(Boolean) as string[])],
    [data],
  );

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:     data.length,
    confirmed: data.filter((g) => g.rsvpStatus === 'confirmed').length,
    pending:   data.filter((g) => g.rsvpStatus === 'pending').length,
    declined:  data.filter((g) => g.rsvpStatus === 'declined').length,
    checkedIn: data.filter((g) => g.checkInAt).length,
  }), [data]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total',      v: stats.total,     cls: 'bg-gray-50  text-gray-700'  },
          { label: 'Confirmed',  v: stats.confirmed, cls: 'bg-green-50 text-green-700' },
          { label: 'Pending',    v: stats.pending,   cls: 'bg-amber-50 text-amber-700' },
          { label: 'Declined',   v: stats.declined,  cls: 'bg-red-50   text-red-700'   },
          { label: 'Checked In', v: stats.checkedIn, cls: 'bg-blue-50  text-blue-700'  },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-3 text-center', s.cls)}>
            <div className="text-2xl font-bold">{s.v}</div>
            <div className="text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={globalFilter}
          onChange={(e) => setGlobal(e.target.value)}
          placeholder="Search by name, phone, email…"
          className="flex-1 min-w-[180px] px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pichwai-gold/30"
        />

        <select
          value={rsvpFilter}
          onChange={(e) => setRsvp(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
        >
          <option value="">All RSVP</option>
          {RSVP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroup(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
          >
            <option value="">All Groups</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        <select
          value={checkinFilter}
          onChange={(e) => setCheckin(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
        >
          <option value="">All Check-in</option>
          <option value="checked">Checked In</option>
          <option value="unchecked">Not Checked In</option>
        </select>

        <div className="flex gap-2 ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => setImport(true)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📥 Import CSV
          </button>
          <button
            type="button"
            onClick={() => exportCSV(filteredData)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📤 Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportPDF(tableRef.current)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📄 Export PDF
          </button>
          <button
            type="button"
            onClick={() => setEdit('new')}
            className="px-5 py-2 rounded-xl bg-pichwai-gold text-white text-sm font-semibold hover:bg-pichwai-saffron transition-colors"
          >
            + Add Guest
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={  { height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 px-4 py-3 bg-pichwai-brown/5 rounded-xl border border-pichwai-gold/20">
              <span className="text-sm font-medium text-pichwai-brown">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => handleResendInvite(selectedIds)}
                disabled={sendingInvites}
                className="px-4 py-1.5 rounded-lg bg-pichwai-gold text-white text-xs font-semibold disabled:opacity-50"
              >
                {sendingInvites ? 'Sending…' : '📨 Send Invites'}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold"
              >
                🗑️ Delete
              </button>
              <button
                type="button"
                onClick={() => setRowSelection({})}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bulkMsg && (
        <p className={cn(
          'text-sm px-3 py-2 rounded-xl',
          bulkMsg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
        )}>
          {bulkMsg}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full text-sm">
            <thead className="bg-pichwai-brown text-white">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
                        h.column.getCanSort() && 'cursor-pointer select-none hover:text-pichwai-gold',
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc'  && <span>↑</span>}
                        {h.column.getIsSorted() === 'desc' && <span>↓</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-t border-gray-100 transition-colors',
                    row.getIsSelected() ? 'bg-pichwai-gold/5' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                    'hover:bg-pichwai-gold/5',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {globalFilter || rsvpFilter || groupFilter || checkinFilter
                      ? 'No guests match your filters'
                      : 'No guests yet — add your first guest above'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
            Showing {table.getRowModel().rows.length} of {data.length} guests
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editGuest !== null && (
          <GuestModal
            key="guest-modal"
            eventId={eventId}
            guest={editGuest === 'new' ? null : editGuest}
            onClose={() => setEdit(null)}
            onSaved={onRefresh}
          />
        )}
        {showImport && (
          <CSVImportModal
            key="import-modal"
            eventId={eventId}
            onClose={() => setImport(false)}
            onImported={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
