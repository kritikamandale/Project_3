'use client';

import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Star, BadgeCheck } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { TIER1_CITIES, TIER2_CITIES } from '@/lib/constants/indianCities';
import { cn } from '@/lib/utils/cn';

const ALL_CITIES = [...TIER1_CITIES, ...TIER2_CITIES];

const EVENT_TYPES = [
  'wedding', 'birthday', 'anniversary', 'corporate',
  'puja', 'engagement', 'babyshower', 'housewarming',
];

export interface FilterState {
  search:    string;
  category:  string;
  city:      string;
  eventType: string;
  minPrice:  number;
  maxPrice:  number;
  minRating: number;
  verified:  boolean;
  sortBy:    string;
}

const DEFAULT_FILTERS: FilterState = {
  search:    '',
  category:  '',
  city:      '',
  eventType: '',
  minPrice:  0,
  maxPrice:  500000,
  minRating: 0,
  verified:  false,
  sortBy:    'relevance',
};

interface VendorFiltersProps {
  filters:   FilterState;
  onChange:  (f: FilterState) => void;
  isMobile?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-cinzel font-semibold uppercase tracking-widest text-[var(--pichwai-gold)] opacity-90">{children}</p>;
}

export function VendorFilters({ filters, onChange, isMobile = false }: VendorFiltersProps) {
  const set = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
      onChange({ ...filters, [key]: value }),
    [filters, onChange],
  );

  const reset = () => onChange(DEFAULT_FILTERS);

  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <aside
      className={cn(
        'flex flex-col gap-5 rounded-3xl border border-[rgba(201,147,58,0.3)] bg-[rgba(42,8,16,0.95)] backdrop-blur-md p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        isMobile && 'max-h-[90vh] overflow-y-auto',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
          <SlidersHorizontal className="h-5 w-5 text-[var(--pichwai-gold)]" /> Filters
        </h2>
        {isDirty && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-semibold text-[rgba(255,255,255,0.5)] hover:text-[var(--pichwai-gold)] transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <SectionLabel>Search</SectionLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pichwai-gold)]" />
          <input
            type="text"
            placeholder="Photographer, Mehendi…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="w-full rounded-xl border border-[rgba(201,147,58,0.4)] bg-[rgba(0,0,0,0.2)] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.5)] focus:border-[var(--pichwai-gold)] focus:outline-none focus:ring-1 focus:ring-[rgba(201,147,58,0.2)] transition-colors"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <SectionLabel>Category</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {VENDOR_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => set('category', filters.category === c.value ? '' : c.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                filters.category === c.value
                  ? 'border-[var(--pichwai-gold)] bg-[var(--pichwai-gold)] text-[#2A0810] shadow-sm'
                  : 'border-[rgba(201,147,58,0.3)] text-[rgba(255,255,255,0.7)] hover:border-[var(--pichwai-gold)] hover:text-white',
              )}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <SectionLabel>City</SectionLabel>
        <select
          value={filters.city}
          onChange={(e) => set('city', e.target.value)}
          className="w-full rounded-xl border border-[rgba(201,147,58,0.4)] bg-[rgba(0,0,0,0.2)] py-2.5 px-3 text-sm text-white focus:border-[var(--pichwai-gold)] focus:outline-none focus:ring-1 focus:ring-[rgba(201,147,58,0.2)] transition-colors"
        >
          <option value="" className="bg-[#2A0810]">All Cities</option>
          <optgroup label="Tier 1" className="bg-[#2A0810]">
            {TIER1_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Tier 2" className="bg-[#2A0810]">
            {TIER2_CITIES.slice(0, 30).map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <SectionLabel>Price Range (₹)</SectionLabel>
        <Slider.Root
          min={0}
          max={500000}
          step={5000}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => onChange({ ...filters, minPrice: min, maxPrice: max })}
          className="relative flex h-5 w-full touch-none select-none items-center mt-2"
        >
          <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
            <Slider.Range className="absolute h-full bg-[var(--pichwai-gold)]" />
          </Slider.Track>
          {[0, 1].map((i) => (
            <Slider.Thumb
              key={i}
              className="block h-5 w-5 rounded-full border-[3px] border-[var(--pichwai-gold)] bg-[#2A0810] shadow focus:outline-none focus:ring-2 focus:ring-[rgba(201,147,58,0.4)] transition-transform hover:scale-110"
            />
          ))}
        </Slider.Root>
        <div className="mt-2 flex justify-between font-display text-sm font-bold text-[var(--pichwai-gold)]">
          <span>₹{filters.minPrice.toLocaleString('en-IN')}</span>
          <span>₹{filters.maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <SectionLabel>Minimum Rating</SectionLabel>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => set('minRating', r)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                filters.minRating === r
                  ? 'border-[var(--pichwai-gold)] bg-[var(--pichwai-gold)] text-[#2A0810] shadow-sm'
                  : 'border-[rgba(201,147,58,0.3)] text-[rgba(255,255,255,0.7)] hover:border-[var(--pichwai-gold)] hover:text-white',
              )}
            >
              {r === 0 ? 'Any' : (
                <>
                  <Star className={cn("h-3.5 w-3.5", filters.minRating === r ? "fill-[#2A0810] text-[#2A0810]" : "fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]")} />
                  {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <label className="flex cursor-pointer items-center gap-3 mt-2 group">
        <div
          role="checkbox"
          aria-checked={filters.verified}
          onClick={() => set('verified', !filters.verified)}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2 transition-all group-hover:border-[var(--pichwai-gold)]',
            filters.verified
              ? 'border-[var(--pichwai-gold)] bg-[var(--pichwai-gold)]'
              : 'border-[rgba(201,147,58,0.4)] bg-[rgba(0,0,0,0.2)]',
          )}
        >
          {filters.verified && (
            <svg className="h-3.5 w-3.5 text-[#2A0810]" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <BadgeCheck className="h-5 w-5 fill-[var(--pichwai-gold)] text-[#2A0810]" /> Verified only
        </span>
      </label>
    </aside>
  );
}

export { DEFAULT_FILTERS };
