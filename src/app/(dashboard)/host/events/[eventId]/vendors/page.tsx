'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, Phone, Mail, Star, ExternalLink } from 'lucide-react';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { cn } from '@/lib/utils/cn';

interface VendorBooking {
  id: string;
  vendorId: string;
  businessName: string;
  category: string;
  phone: string;
  email?: string;
  status: string;
  quotedAmount?: string;
  finalAmount?: string;
  advancePaid: boolean;
  serviceDate: string;
  notes?: string;
  averageRating?: string;
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  inquiry:     'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
  quoted:      'bg-blue-50 text-blue-700',
  confirmed:   'bg-green-50 text-green-700',
  in_progress: 'bg-purple-50 text-purple-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-50 text-red-600',
  disputed:    'bg-orange-50 text-orange-700',
};

function formatCurrency(v: string | number) {
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function EventVendorsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [bookings, setBookings]       = useState<VendorBooking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setCategory] = useState('all');

  useEffect(() => {
    fetch(`/api/events/${eventId}/vendors`)
      .then((r) => r.json())
      .then((d) => setBookings(Array.isArray(d?.bookings) ? d.bookings : Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const categories = ['all', ...new Set(bookings.map((b) => b.category))];
  const filtered   = activeCategory === 'all' ? bookings : bookings.filter((b) => b.category === activeCategory);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Vendors</h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">{bookings.length} vendor{bookings.length !== 1 ? 's' : ''} booked</p>
        </div>
        <a
          href="/host/vendors"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition shadow-sm"
        >
          <ShoppingBag className="h-4 w-4" /> Browse Vendors
        </a>
      </div>

      {/* Category filter chips */}
      {bookings.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const meta = VENDOR_CATEGORIES.find((v) => v.value === cat);
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize transition',
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                    : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
                )}
              >
                {meta?.icon && <span>{meta.icon}</span>}
                {meta?.label ?? cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Vendor list */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-16 text-center shadow-sm">
          <ShoppingBag className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-50" />
          <p className="text-[var(--muted-fg)] mb-4">No vendors booked yet.</p>
          <a
            href="/host/vendors"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] hover:opacity-90 transition"
          >
            <ExternalLink className="h-4 w-4" /> Find Vendors
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((booking) => {
            const catMeta = VENDOR_CATEGORIES.find((v) => v.value === booking.category);
            const amount  = booking.finalAmount ?? booking.quotedAmount;
            return (
              <div
                key={booking.id}
                className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[var(--pichwai-gold)] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{catMeta?.icon ?? '🏢'}</span>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{booking.businessName}</p>
                      <p className="text-xs text-[var(--muted-fg)] capitalize">{catMeta?.label ?? booking.category}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BOOKING_STATUS_STYLES[booking.status] ?? BOOKING_STATUS_STYLES.inquiry}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-[var(--muted-fg)]">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{booking.phone}</div>
                  {booking.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{booking.email}</div>}
                  {booking.averageRating && Number(booking.averageRating) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-[var(--pichwai-gold)] fill-current" />
                      <span>{Number(booking.averageRating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {amount && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-fg)]">
                      {booking.finalAmount ? 'Final Amount' : 'Quoted Amount'}
                    </span>
                    <span className="font-semibold text-[var(--pichwai-gold-deep)]">{formatCurrency(amount)}</span>
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
