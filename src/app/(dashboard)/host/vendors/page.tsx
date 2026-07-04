'use client';

import { useState } from 'react';
import { Search, Star, MapPin, Phone } from 'lucide-react';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { cn } from '@/lib/utils/cn';

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  averageRating: string;
  totalReviews: number;
  priceStartingFrom?: string;
  description?: string;
  isVerified: string;
}

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function HostVendorsPage() {
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setCategory] = useState('all');
  const [vendors, setVendors]         = useState<Vendor[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);

  async function doSearch(cat = activeCategory, q = search) {
    setLoading(true);
    setSearched(true);
    try {
      const p = new URLSearchParams({ limit: '20' });
      if (cat !== 'all') p.set('category', cat);
      if (q)             p.set('search', q);
      const res  = await fetch(`/api/vendors?${p}`);
      const data = await res.json() as { items?: Vendor[] };
      setVendors(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    doSearch(activeCategory, searchInput);
  }

  function selectCategory(cat: string) {
    setCategory(cat);
    doSearch(cat, search);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Find Vendors</h1>
        <p className="text-sm text-[var(--muted-fg)] mt-1">Browse trusted vendors for your events.</p>
      </div>

      {/* Search */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-fg)]" />
            <input
              type="text"
              placeholder="Search vendors by name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-fg)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition"
          >
            Search
          </button>
        </form>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => selectCategory('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition',
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
            )}
          >
            All
          </button>
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => selectCategory(cat.value)}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition',
                activeCategory === cat.value
                  ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
              )}
            >
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!searched ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-[var(--muted-fg)]">Select a category or search to find vendors.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <p className="text-4xl mb-4">😔</p>
          <p className="text-[var(--muted-fg)]">No vendors found. Try a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => {
            const catMeta = VENDOR_CATEGORIES.find((v) => v.value === vendor.category);
            return (
              <div
                key={vendor.id}
                className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[var(--pichwai-gold)] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{catMeta?.icon ?? '🏢'}</span>
                    <div>
                      <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--pichwai-gold-deep)] transition-colors">
                        {vendor.businessName}
                      </p>
                      <p className="text-xs text-[var(--muted-fg)]">{catMeta?.label ?? vendor.category}</p>
                    </div>
                  </div>
                  {vendor.isVerified === 'verified' && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[var(--muted-fg)]">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{vendor.city}, {vendor.state}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{vendor.phone}</div>
                  {Number(vendor.averageRating) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[var(--pichwai-gold)] fill-current" />
                      <span>{Number(vendor.averageRating).toFixed(1)}</span>
                      <span className="text-[var(--muted-fg)]">({vendor.totalReviews})</span>
                    </div>
                  )}
                </div>

                {vendor.priceStartingFrom && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs text-[var(--muted-fg)]">Starting from</span>
                    <span className="text-sm font-bold text-[var(--pichwai-gold-deep)]">
                      {formatCurrency(vendor.priceStartingFrom)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
