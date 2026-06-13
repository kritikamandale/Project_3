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
  return <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-pichwai-brown-500">{children}</p>;
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
        'flex flex-col gap-5 rounded-2xl border border-pichwai-gold-200/40 bg-white p-5 shadow-sm',
        isMobile && 'max-h-[90vh] overflow-y-auto',
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-pichwai-brown-800">
          <SlidersHorizontal className="h-4 w-4 text-pichwai-gold-500" /> Filters
        </h2>
        {isDirty && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-pichwai-brown-400 hover:text-pichwai-saffron-500"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <SectionLabel>Search</SectionLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pichwai-brown-300" />
          <input
            type="text"
            placeholder="Photographer, Mehendi…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="w-full rounded-lg border border-pichwai-gold-200 bg-pichwai-cream-50 py-2 pl-9 pr-3 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none"
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
                'rounded-full border px-2.5 py-1 text-xs transition',
                filters.category === c.value
                  ? 'border-pichwai-gold-500 bg-pichwai-gold-50 font-semibold text-pichwai-gold-700'
                  : 'border-pichwai-gold-100 text-pichwai-brown-600 hover:border-pichwai-gold-300',
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
          className="w-full rounded-lg border border-pichwai-gold-200 bg-pichwai-cream-50 py-2 px-3 text-sm text-pichwai-brown-800 focus:border-pichwai-gold-400 focus:outline-none"
        >
          <option value="">All Cities</option>
          <optgroup label="Tier 1">
            {TIER1_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Tier 2">
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
          className="relative flex h-5 w-full touch-none select-none items-center"
        >
          <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-pichwai-gold-100">
            <Slider.Range className="absolute h-full bg-pichwai-gold-400" />
          </Slider.Track>
          {[0, 1].map((i) => (
            <Slider.Thumb
              key={i}
              className="block h-4 w-4 rounded-full border-2 border-pichwai-gold-500 bg-white shadow focus:outline-none focus:ring-2 focus:ring-pichwai-gold-300"
            />
          ))}
        </Slider.Root>
        <div className="mt-1 flex justify-between text-xs text-pichwai-brown-500">
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
                'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition',
                filters.minRating === r
                  ? 'border-pichwai-gold-500 bg-pichwai-gold-50 font-semibold text-pichwai-gold-700'
                  : 'border-pichwai-gold-100 text-pichwai-brown-600 hover:border-pichwai-gold-300',
              )}
            >
              {r === 0 ? 'Any' : (
                <>
                  <Star className="h-3 w-3 fill-pichwai-gold-400 text-pichwai-gold-400" />
                  {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <label className="flex cursor-pointer items-center gap-2">
        <div
          role="checkbox"
          aria-checked={filters.verified}
          onClick={() => set('verified', !filters.verified)}
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded border-2 transition',
            filters.verified
              ? 'border-pichwai-gold-500 bg-pichwai-gold-500'
              : 'border-pichwai-brown-300',
          )}
        >
          {filters.verified && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="flex items-center gap-1 text-sm text-pichwai-brown-700">
          <BadgeCheck className="h-4 w-4 text-pichwai-blue-500" /> Verified only
        </span>
      </label>
    </aside>
  );
}

export { DEFAULT_FILTERS };
