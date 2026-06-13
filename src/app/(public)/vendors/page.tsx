'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { use } from 'react';
import useSWRInfinite from 'swr/infinite';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, X, Loader2, Search } from 'lucide-react';
import { VendorCard, type VendorCardData } from '@/components/vendors/VendorCard';
import { VendorFilters, DEFAULT_FILTERS, type FilterState } from '@/components/vendors/VendorFilters';
import { BookingModal } from '@/components/vendors/BookingModal';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils/cn';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating',    label: 'Top Rated' },
  { value: 'priceAsc',  label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'reviews',   label: 'Most Reviews' },
];

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load vendors');
  return res.json() as Promise<{ items: VendorCardData[]; nextCursor: string | null; total: number }>;
}

function buildUrl(filters: FilterState, cursor?: string | null): string {
  const p = new URLSearchParams();
  if (filters.search)    p.set('search',    filters.search);
  if (filters.category)  p.set('category',  filters.category);
  if (filters.city)      p.set('city',      filters.city);
  if (filters.minPrice)  p.set('minPrice',  String(filters.minPrice));
  if (filters.maxPrice < 500000) p.set('maxPrice', String(filters.maxPrice));
  if (filters.minRating) p.set('minRating', String(filters.minRating));
  if (filters.verified)  p.set('verified',  'true');
  if (filters.sortBy !== 'relevance') p.set('sortBy', filters.sortBy);
  if (cursor)            p.set('cursor',    cursor);
  p.set('limit', '20');
  return `/api/vendors?${p.toString()}`;
}

function EmptyState() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="col-span-full flex flex-col items-center gap-6 py-20 text-center"
    >
      {/* Pichwai lotus illustration placeholder */}
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-pichwai-cream-100 text-6xl">
        🌸
      </div>
      <div>
        <h3 className="font-playfair text-xl font-semibold text-pichwai-brown-700">
          No vendors found
        </h3>
        <p className="mt-1 text-sm text-pichwai-brown-400">
          Try adjusting your filters or search terms
        </p>
      </div>
    </motion.div>
  );
}

function VendorCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-pichwai-gold-100 bg-white">
      <div className="aspect-[4/3] bg-pichwai-cream-100" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-20 rounded bg-pichwai-cream-200" />
        <div className="h-4 w-3/4 rounded bg-pichwai-cream-200" />
        <div className="h-3 w-1/2 rounded bg-pichwai-cream-200" />
        <div className="h-3 w-32 rounded bg-pichwai-cream-200" />
        <div className="mt-2 flex justify-between">
          <div className="h-5 w-20 rounded bg-pichwai-cream-200" />
          <div className="h-7 w-20 rounded-lg bg-pichwai-cream-200" />
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTERS);
  const [activeFilters, setActive]    = useState<FilterState>(DEFAULT_FILTERS);
  const [showMobileFilters, setMobileFilters] = useState(false);
  const [bookingVendorId, setBookingVendorId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Debounce filter application
  useEffect(() => {
    const t = setTimeout(() => setActive(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: { items: VendorCardData[]; nextCursor: string | null } | null) => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = pageIndex === 0 ? null : previousPageData?.nextCursor;
      return buildUrl(activeFilters, cursor);
    },
    [activeFilters],
  );

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const allVendors = data?.flatMap((p) => p.items) ?? [];
  const total      = data?.[0]?.total ?? 0;
  const hasMore    = !!data?.at(-1)?.nextCursor;

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !isValidating) setSize((s) => s + 1); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isValidating, setSize]);

  return (
    <div className="min-h-screen bg-pichwai-cream-50 pb-20">
      {/* Hero header */}
      <section className="border-b border-pichwai-gold-100 bg-white px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-playfair text-3xl font-bold text-pichwai-brown-800 sm:text-4xl">
            Find the Perfect Vendor
          </h1>
          <p className="mt-2 text-pichwai-brown-500">
            {total > 0 ? `${total.toLocaleString('en-IN')} verified vendors across India` : 'Browse verified vendors across India'}
          </p>

          {/* Top search bar */}
          <div className="mt-5 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pichwai-brown-300" />
              <input
                type="text"
                placeholder="Search photographers, caterers, decorators…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 py-3 pl-12 pr-4 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold-100"
              />
            </div>
            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
              className="hidden rounded-xl border border-pichwai-gold-200 bg-white px-4 py-3 text-sm text-pichwai-brown-700 focus:border-pichwai-gold-400 focus:outline-none sm:block"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilters(true)}
              className="flex items-center gap-2 rounded-xl border border-pichwai-gold-200 bg-white px-4 py-3 text-sm text-pichwai-brown-700 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-6 sm:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20">
            <VendorFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        {/* Results grid */}
        <main className="flex-1 min-w-0">
          {/* Sort bar (mobile) */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm text-pichwai-brown-500">
              {total > 0 && `${total.toLocaleString('en-IN')} results`}
            </p>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
              className="rounded-lg border border-pichwai-gold-200 bg-white px-3 py-1.5 text-xs text-pichwai-brown-700 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <VendorCardSkeleton key={i} />)}
            </div>
          ) : allVendors.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {allVendors.map((vendor) => (
                <motion.div key={vendor.id} variants={fadeInUp}>
                  <VendorCard
                    vendor={vendor}
                    onGetQuote={(id) => setBookingVendorId(id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="mt-8 flex justify-center">
            {isValidating && !isLoading && (
              <Loader2 className="h-6 w-6 animate-spin text-pichwai-gold-400" />
            )}
          </div>
        </main>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[min(85vw,360px)] overflow-y-auto bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pichwai-gold-100 px-5 py-4">
                <span className="font-playfair text-lg font-semibold text-pichwai-brown-800">Filters</span>
                <button onClick={() => setMobileFilters(false)}>
                  <X className="h-5 w-5 text-pichwai-brown-500" />
                </button>
              </div>
              <div className="p-4">
                <VendorFilters filters={filters} onChange={setFilters} isMobile />
              </div>
              <div className="border-t border-pichwai-gold-100 px-5 py-4">
                <button
                  onClick={() => setMobileFilters(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-3 text-sm font-semibold text-white"
                >
                  Show {total > 0 ? total.toLocaleString('en-IN') : ''} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {bookingVendorId && (
          <BookingModal
            vendorId={bookingVendorId}
            onClose={() => setBookingVendorId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
