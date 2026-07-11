'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Clock, BadgeCheck, ExternalLink,
  Globe, Phone, ChevronDown, ChevronUp, X, ZoomIn,
} from 'lucide-react';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { BookingModal } from '@/components/vendors/BookingModal';
import { ReviewForm } from '@/components/vendors/ReviewForm';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils/cn';

async function fetchVendor(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-5 w-5',
            i < Math.round(rating) ? 'fill-pichwai-gold-400 text-pichwai-gold-400' : 'fill-transparent text-pichwai-brown-200',
          )}
        />
      ))}
      <span className="text-lg font-bold text-pichwai-brown-800">{Number(rating).toFixed(1)}</span>
      <span className="text-sm text-pichwai-brown-400">({count} reviews)</span>
    </div>
  );
}

function RatingBreakdown({ reviews }: { reviews: Array<{ rating: number }> }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;

  return (
    <div className="flex flex-col gap-1">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-4 text-pichwai-brown-500">{star}</span>
          <Star className="h-3 w-3 fill-pichwai-gold-300 text-pichwai-gold-300" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-pichwai-cream-200">
            <div
              className="h-full rounded-full bg-pichwai-gold-400 transition-all"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-4 text-right text-pichwai-brown-400">{count}</span>
        </div>
      ))}
    </div>
  );
}

interface Package { name: string; price: number; inclusions: string[] }
interface FAQ     { question: string; answer: string }

function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <div className="rounded-2xl border border-pichwai-gold-200 bg-white p-5 shadow-sm">
      <h4 className="font-playfair text-lg font-semibold text-pichwai-brown-800">{pkg.name}</h4>
      <p className="mt-1 text-2xl font-bold text-pichwai-gold-600">
        ₹{pkg.price.toLocaleString('en-IN')}
      </p>
      {pkg.inclusions?.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {pkg.inclusions.map((inc: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-pichwai-brown-600">
              <span className="mt-0.5 text-pichwai-gold-500">✓</span>
              {inc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-pichwai-gold-100 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-pichwai-brown-800">{faq.question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-pichwai-gold-500" /> : <ChevronDown className="h-4 w-4 text-pichwai-gold-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-sm text-pichwai-brown-500"
          >
            <span className="mt-2 block">{faq.answer}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data, isLoading, mutate } = useSWR(`/api/vendors/${slug}`, fetchVendor);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pichwai-gold-200 border-t-pichwai-gold-500" />
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-2xl">🪷</p>
        <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-700">Vendor not found</h2>
        <Link href="/vendors" className="text-sm text-pichwai-gold-600 underline">Browse all vendors</Link>
      </div>
    );
  }

  const { vendor, reviews } = data as {
    vendor: {
      id: string;
      businessName: string;
      tagline: string | null;
      category: string;
      logoUrl: string | null;
      coverImageUrl: string | null;
      city: string;
      state: string;
      description: string | null;
      websiteUrl: string | null;
      instagramUrl: string | null;
      phone: string;
      priceStartingFrom: string | null;
      averageRating: string;
      totalReviews: number;
      isVerified: string;
      responseTimeHours: number;
      yearsExperience: number;
      totalEventsDone: number;
      packages: Package[];
      faq: FAQ[];
      metadata: { gallery?: string[] };
    };
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      reviewText: string | null;
      isVerifiedBooking: boolean;
      vendorResponse: string | null;
      createdAt: string;
      reviewerName: string;
      reviewerAvatar: string | null;
    }>;
  };

  const categoryMeta = VENDOR_CATEGORIES.find((c) => c.value === vendor.category);
  const gallery: string[] = vendor.metadata?.gallery ?? (vendor.coverImageUrl ? [vendor.coverImageUrl] : []);
  const rating = parseFloat(vendor.averageRating ?? '0');

  return (
    <div className="min-h-screen bg-pichwai-cream-50 pb-24">
      {/* Hero / cover */}
      <div className="relative h-64 w-full overflow-hidden bg-pichwai-brown-900 sm:h-80 lg:h-96">
        {vendor.coverImageUrl && (
          <Image
            src={vendor.coverImageUrl}
            alt={vendor.businessName}
            fill
            className="object-cover opacity-70"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Profile card */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="-mt-16 mb-8 flex flex-col gap-4 rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-lg sm:flex-row sm:items-end"
        >
          {/* Logo */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-pichwai-gold-200 bg-pichwai-cream-100 shadow-md">
            {vendor.logoUrl ? (
              <Image src={vendor.logoUrl} alt={vendor.businessName} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl">{categoryMeta?.icon}</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-playfair text-2xl font-bold text-pichwai-brown-900 sm:text-3xl">
                {vendor.businessName}
              </h1>
              {vendor.isVerified === 'verified' && (
                <span className="flex items-center gap-1 rounded-full bg-pichwai-blue-50 px-2.5 py-0.5 text-xs font-semibold text-pichwai-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            {vendor.tagline && (
              <p className="mt-1 text-pichwai-brown-500">{vendor.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-pichwai-saffron-50 px-2.5 py-0.5 text-xs font-medium text-pichwai-saffron-700">
                {categoryMeta?.icon} {categoryMeta?.label}
              </span>
              <span className="flex items-center gap-1 text-sm text-pichwai-brown-500">
                <MapPin className="h-4 w-4 text-pichwai-saffron-400" /> {vendor.city}, {vendor.state}
              </span>
              <span className="flex items-center gap-1 text-sm text-pichwai-brown-500">
                <Clock className="h-4 w-4" /> Responds in {vendor.responseTimeHours}h
              </span>
            </div>
            <div className="mt-2">
              <StarRow rating={rating} count={vendor.totalReviews} />
            </div>
          </div>

          {/* CTA (desktop) */}
          <div className="hidden sm:flex flex-col items-end gap-2">
            {vendor.priceStartingFrom && (
              <div className="text-right">
                <p className="text-xs text-pichwai-brown-400">Starting from</p>
                <p className="text-2xl font-bold text-pichwai-brown-800">
                  ₹{Number(vendor.priceStartingFrom).toLocaleString('en-IN')}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowBookingModal(true)}
              className="rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 px-6 py-3 font-semibold text-white shadow-md hover:opacity-90"
            >
              Book Now / Get Quote
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Gallery */}
            {gallery.length > 0 && (
              <section className="rounded-2xl border border-pichwai-gold-200 bg-white p-6">
                <h2 className="mb-4 font-playfair text-xl font-semibold text-pichwai-brown-800">Gallery</h2>
                <div className="columns-2 gap-3 sm:columns-3">
                  {gallery.map((img, i) => (
                    <div
                      key={i}
                      className="group mb-3 cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => setLightboxImg(img)}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={img}
                          alt={`Gallery ${i + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            {vendor.description && (
              <section className="rounded-2xl border border-pichwai-gold-200 bg-white p-6">
                <h2 className="mb-4 font-playfair text-xl font-semibold text-pichwai-brown-800">About</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-pichwai-brown-600">
                  {vendor.description}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-pichwai-gold-100 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pichwai-gold-600">{vendor.yearsExperience}+</p>
                    <p className="text-xs text-pichwai-brown-400">Years Experience</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pichwai-gold-600">{vendor.totalEventsDone}+</p>
                    <p className="text-xs text-pichwai-brown-400">Events Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pichwai-gold-600">{vendor.totalReviews}</p>
                    <p className="text-xs text-pichwai-brown-400">Reviews</p>
                  </div>
                </div>
              </section>
            )}

            {/* Packages */}
            {vendor.packages?.length > 0 && (
              <section className="rounded-2xl border border-pichwai-gold-200 bg-white p-6">
                <h2 className="mb-4 font-playfair text-xl font-semibold text-pichwai-brown-800">Packages</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {vendor.packages.map((pkg, i) => <PackageCard key={i} pkg={pkg} />)}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl border border-pichwai-gold-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">
                  Reviews ({vendor.totalReviews})
                </h2>
                <button
                  onClick={() => setShowReviewForm((v) => !v)}
                  className="text-sm text-pichwai-gold-600 underline hover:text-pichwai-gold-700"
                >
                  {showReviewForm ? 'Cancel' : 'Write a Review'}
                </button>
              </div>

              {reviews.length > 0 && <RatingBreakdown reviews={reviews} />}

              <AnimatePresence>
                {showReviewForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 p-4"
                  >
                    <ReviewForm
                      vendorId={vendor.id}
                      bookingId=""
                      eventId=""
                      onSuccess={() => { setShowReviewForm(false); mutate(); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex flex-col gap-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-sm text-pichwai-brown-400">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-pichwai-gold-100 bg-pichwai-cream-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {review.reviewerAvatar ? (
                            <Image src={review.reviewerAvatar} alt={review.reviewerName} width={36} height={36} className="rounded-full" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pichwai-gold-100 text-sm font-bold text-pichwai-gold-600">
                              {review.reviewerName?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-pichwai-brown-800">{review.reviewerName}</p>
                            <p className="text-xs text-pichwai-brown-400">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-pichwai-gold-400 text-pichwai-gold-400' : 'fill-transparent text-pichwai-brown-200')} />
                          ))}
                          {review.isVerifiedBooking && (
                            <span className="ml-1 text-xs text-pichwai-blue-500">✓ Verified</span>
                          )}
                        </div>
                      </div>
                      {review.title && <p className="mt-2 text-sm font-semibold text-pichwai-brown-700">{review.title}</p>}
                      {review.reviewText && <p className="mt-1 text-sm text-pichwai-brown-600">{review.reviewText}</p>}
                      {review.vendorResponse && (
                        <div className="mt-3 rounded-lg bg-pichwai-cream-100 p-3 text-sm">
                          <p className="font-semibold text-pichwai-brown-700">Vendor&apos;s Response</p>
                          <p className="mt-1 text-pichwai-brown-500">{review.vendorResponse}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* FAQ */}
            {vendor.faq?.length > 0 && (
              <section className="rounded-2xl border border-pichwai-gold-200 bg-white p-6">
                <h2 className="mb-4 font-playfair text-xl font-semibold text-pichwai-brown-800">
                  Frequently Asked Questions
                </h2>
                {vendor.faq.map((item, i) => <FAQItem key={i} faq={item} />)}
              </section>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:w-72 lg:shrink-0">
            <div className="sticky top-20 flex flex-col gap-4 rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm">
              {vendor.priceStartingFrom && (
                <div>
                  <p className="text-xs text-pichwai-brown-400">Starting from</p>
                  <p className="text-3xl font-bold text-pichwai-brown-800">
                    ₹{Number(vendor.priceStartingFrom).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-3 font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Book Now / Get Quote
              </button>

              <div className="flex flex-col gap-2 border-t border-pichwai-gold-100 pt-3 text-sm text-pichwai-brown-500">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 hover:text-pichwai-gold-600">
                    <Phone className="h-4 w-4" /> {vendor.phone}
                  </a>
                )}
                {vendor.websiteUrl && (
                  <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-pichwai-gold-600">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {vendor.instagramUrl && (
                  <a href={vendor.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-pichwai-gold-600">
                    <ExternalLink className="h-4 w-4" /> Instagram
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxImg(null)}
          >
            <button className="absolute right-4 top-4 text-white" onClick={() => setLightboxImg(null)}>
              <X className="h-7 w-7" />
            </button>
            <div className="relative max-h-[90vh] max-w-4xl w-full aspect-video">
              <Image src={lightboxImg} alt="Gallery" fill className="object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {showBookingModal && (
          <BookingModal vendorId={vendor.id} onClose={() => setShowBookingModal(false)} />
        )}
      </AnimatePresence>

      {/* Mobile sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-pichwai-gold-100 bg-white px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between gap-4">
          {vendor.priceStartingFrom && (
            <div>
              <p className="text-xs text-pichwai-brown-400">Starting from</p>
              <p className="font-bold text-pichwai-brown-800">
                ₹{Number(vendor.priceStartingFrom).toLocaleString('en-IN')}
              </p>
            </div>
          )}
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-3 font-semibold text-white shadow"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
