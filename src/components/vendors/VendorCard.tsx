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
              ? 'fill-pichwai-gold-400 text-pichwai-gold-400'
              : 'fill-transparent text-pichwai-brown-200',
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
        'group relative flex flex-col overflow-hidden rounded-2xl border border-pichwai-gold-200/40 bg-white shadow-sm transition-shadow hover:shadow-pichwai',
        className,
      )}
    >
      {vendor.isFeatured && (
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-pichwai-gold-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          <Sparkles className="h-3 w-3" /> Featured
        </span>
      )}

      {/* Cover photo */}
      <Link href={`/vendors/${vendor.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-pichwai-cream-100">
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
          <span className="rounded-full bg-pichwai-saffron-50 px-2.5 py-0.5 text-xs font-medium text-pichwai-saffron-700">
            {categoryMeta?.icon} {categoryMeta?.label ?? vendor.category}
          </span>
          {vendor.isVerified === 'verified' && (
            <span className="flex items-center gap-1 text-xs text-pichwai-blue-600">
              <BadgeCheck className="h-3.5 w-3.5 fill-pichwai-blue-100" /> Verified
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
              className="block truncate font-playfair text-base font-semibold text-pichwai-brown-800 hover:text-pichwai-gold-600"
            >
              {vendor.businessName}
            </Link>
            {vendor.tagline && (
              <p className="truncate text-xs text-pichwai-brown-400">{vendor.tagline}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-pichwai-brown-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-pichwai-saffron-500" />
          {vendor.city}, {vendor.state}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} />
          <span className="text-xs font-medium text-pichwai-brown-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-pichwai-brown-400">
            ({vendor.totalReviews} reviews)
          </span>
        </div>

        {/* Response time */}
        <p className="flex items-center gap-1 text-xs text-pichwai-brown-400">
          <Clock className="h-3.5 w-3.5" />
          Responds in {vendor.responseTimeHours < 24 ? `${vendor.responseTimeHours}h` : `${Math.round(vendor.responseTimeHours / 24)}d`}
        </p>

        {/* Pricing + CTA */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-pichwai-gold-100">
          <div>
            {vendor.priceStartingFrom ? (
              <>
                <span className="text-xs text-pichwai-brown-400">Starting from</span>
                <p className="font-semibold text-pichwai-brown-800">
                  ₹{Number(vendor.priceStartingFrom).toLocaleString('en-IN')}
                </p>
              </>
            ) : (
              <span className="text-xs text-pichwai-brown-400">Contact for pricing</span>
            )}
          </div>
          <button
            onClick={() => onGetQuote?.(vendor.id)}
            className="rounded-lg bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
          >
            Get Quote
          </button>
        </div>
      </div>
    </motion.div>
  );
}
