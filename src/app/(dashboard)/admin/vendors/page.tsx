'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Star, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { cn } from '@/lib/utils/cn';

interface AdminVendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  averageRating: string;
  totalReviews: number;
  isVerified: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const VERIFICATION_TABS = ['all', 'pending', 'verified', 'rejected', 'suspended'] as const;

const VERIFICATION_STYLES: Record<string, string> = {
  pending:   'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
  verified:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-600',
  suspended: 'bg-gray-100 text-gray-600',
};

const VERIFICATION_ICONS: Record<string, React.ElementType> = {
  pending:   Clock,
  verified:  CheckCircle2,
  rejected:  XCircle,
  suspended: XCircle,
};

export default function AdminVendorsPage() {
  const [vendors, setVendors]         = useState<AdminVendor[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [verStatus, setVerStatus]     = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');

  const fetchVendors = useCallback(async (page = 1, vs = verStatus, q = search) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (vs !== 'all') p.set('isVerified', vs);
      if (q)            p.set('search', q);
      const res  = await fetch(`/api/admin/vendors?${p}`);
      const data = await res.json() as { vendors: AdminVendor[]; pagination: Pagination };
      setVendors(data.vendors ?? []);
      setPagination(data.pagination ?? { page, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [verStatus, search]);

  useEffect(() => { fetchVendors(1, verStatus, search); }, [verStatus, search, fetchVendors]);

  async function updateVerification(vendorId: string, status: 'verified' | 'rejected') {
    try {
      await fetch(`/api/admin/vendors/${vendorId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isVerified: status }),
      });
      setVendors((prev) => prev.map((v) => v.id === vendorId ? { ...v, isVerified: status } : v));
    } catch {
      alert('Action failed. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Vendors</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">{pagination.total} vendors on platform</p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-fg)]" />
            <input
              type="text"
              placeholder="Search vendors…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-fg)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition">Search</button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {VERIFICATION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setVerStatus(tab)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition',
                verStatus === tab
                  ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <ShoppingBag className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--muted-fg)]">No vendors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vendors.map((vendor) => {
            const catMeta   = VENDOR_CATEGORIES.find((v) => v.value === vendor.category);
            const StatusIcon = VERIFICATION_ICONS[vendor.isVerified] ?? Clock;
            return (
              <div
                key={vendor.id}
                className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[var(--pichwai-gold)] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{catMeta?.icon ?? '🏢'}</span>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{vendor.businessName}</p>
                      <p className="text-xs text-[var(--muted-fg)]">{catMeta?.label ?? vendor.category} · {vendor.city}</p>
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', VERIFICATION_STYLES[vendor.isVerified] ?? VERIFICATION_STYLES.pending)}>
                    <StatusIcon className="h-3 w-3" />
                    {vendor.isVerified}
                  </span>
                </div>

                {Number(vendor.averageRating) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[var(--muted-fg)] mb-3">
                    <Star className="h-3.5 w-3.5 text-[var(--pichwai-gold)] fill-current" />
                    {Number(vendor.averageRating).toFixed(1)} ({vendor.totalReviews} reviews)
                  </div>
                )}

                {/* Admin actions for pending vendors */}
                {vendor.isVerified === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                    <button
                      onClick={() => updateVerification(vendor.id, 'verified')}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:opacity-90 transition"
                    >
                      ✓ Verify
                    </button>
                    <button
                      onClick={() => updateVerification(vendor.id, 'rejected')}
                      className="flex-1 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchVendors(pagination.page - 1)} disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--muted-fg)]">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchVendors(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
