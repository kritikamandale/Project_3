'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Clock, BadgeCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardHover } from '@/lib/animations';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { cn } from '@/lib/utils/cn';

export interface VendorCardData {
  id: string;
  slug: string;
  businessName: string;
  tagline?: string | null;
  category: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  city: string;
  state: string;
  priceStartingFrom?: string | null;
  currency: string;
  averageRating: string;
  totalReviews: number;
  isVerified: string;
  isFeatured: boolean;
  responseTimeHours: number;
}

interface VendorCardProps {
  vendor: VendorCardData;
  onGetQuote?: (vendorId: string) => void;
  className?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < Math.round(rating)
              ? 'fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]'
              : 'fill-transparent text-[rgba(255,255,255,0.2)]',
          )}
        />
      ))}
    </span>
  );
}

export function VendorCard({ vendor, onGetQuote, className }: VendorCardProps) {
  const categoryMeta = VENDOR_CATEGORIES.find((c) => c.value === vendor.category);
  const rating = parseFloat(vendor.averageRating ?? '0');

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(201,147,58,0.3)] bg-[rgba(42,8,16,0.95)] backdrop-blur-md shadow-sm transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[var(--pichwai-gold)]',
        className,
      )}
    >
      {vendor.isFeatured && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-pichwai-gold-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          <Sparkles className="h-3 w-3" /> Featured
        </span>
      )}

      {/* Cover photo */}
      <Link href={`/vendors/${vendor.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[rgba(255,255,255,0.05)]">
        {vendor.coverImageUrl ? (
          <Image
            src={vendor.coverImageUrl}
            alt={vendor.businessName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {categoryMeta?.icon ?? '📦'}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[rgba(201,147,58,0.15)] border border-[rgba(201,147,58,0.3)] px-2.5 py-0.5 text-xs font-medium text-[var(--pichwai-gold)]">
            {categoryMeta?.icon} {categoryMeta?.label ?? vendor.category}
          </span>
          {vendor.isVerified === 'verified' && (
            <span className="flex items-center gap-1 text-xs text-[var(--pichwai-gold)]">
              <BadgeCheck className="h-3.5 w-3.5 fill-[var(--pichwai-gold)] text-[#2A0810]" /> Verified
            </span>
          )}
        </div>

        {/* Logo + Name */}
        <div className="flex items-center gap-2">
          {vendor.logoUrl && (
            <Image
              src={vendor.logoUrl}
              alt={`${vendor.businessName} logo`}
              width={36}
              height={36}
              className="rounded-full object-cover ring-1 ring-pichwai-gold-200"
            />
          )}
          <div className="min-w-0">
            <Link
              href={`/vendors/${vendor.slug}`}
              className="block truncate font-display text-lg font-bold text-white hover:text-[var(--pichwai-gold)] transition-colors"
            >
              {vendor.businessName}
            </Link>
            {vendor.tagline && (
              <p className="truncate text-xs text-[rgba(255,255,255,0.7)]">{vendor.tagline}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <p className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.8)] mt-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--pichwai-gold)]" />
          {vendor.city}, {vendor.state}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} />
          <span className="text-xs font-bold text-[var(--pichwai-gold)]">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-[rgba(255,255,255,0.5)]">
            ({vendor.totalReviews} reviews)
          </span>
        </div>

        {/* Response time */}
        <p className="flex items-center gap-1 text-xs text-[rgba(255,255,255,0.6)]">
          <Clock className="h-3.5 w-3.5" />
          Responds in {vendor.responseTimeHours < 24 ? `${vendor.responseTimeHours}h` : `${Math.round(vendor.responseTimeHours / 24)}d`}
        </p>

        {/* Pricing + CTA */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[rgba(201,147,58,0.2)]">
          <div>
            {vendor.priceStartingFrom ? (
              <>
                <span className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.5)] block mb-0.5">Starting from</span>
                <p className="font-display font-bold text-lg text-[var(--pichwai-gold)]">
                  ₹{Number(vendor.priceStartingFrom).toLocaleString('en-IN')}
                </p>
              </>
            ) : (
              <span className="text-xs text-[rgba(255,255,255,0.5)]">Contact for pricing</span>
            )}
          </div>
          <button
            onClick={() => onGetQuote?.(vendor.id)}
            className="rounded-xl bg-[var(--pichwai-gold)] px-4 py-2 text-xs font-bold text-[#2A0810] shadow-sm transition hover:bg-white active:scale-95"
          >
            Get Quote
          </button>
        </div>
      </div>
    </motion.div>
  );
}
