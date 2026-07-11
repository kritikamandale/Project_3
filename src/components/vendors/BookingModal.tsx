'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, CalendarDays, FileText, IndianRupee, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { overlayVariants, drawerVariants } from '@/lib/animations';

interface BookingFormData {
  eventId:            string;
  serviceDate:        string;
  serviceDescription: string;
  budgetEstimate:     string;
}

interface HostEvent { id: string; title: string; eventDate: string }

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

interface BookingModalProps {
  vendorId:     string;
  onClose:      () => void;
  onSuccess?:   (bookingId: string) => void;
}

export function BookingModal({ vendorId, onClose, onSuccess }: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const { data: eventsData } = useSWR<{ events: HostEvent[] }>('/api/events?role=host&limit=50', fetcher);
  const events = eventsData?.events ?? [];

  const { data: vendorData } = useSWR(`/api/vendors/${vendorId}`, fetcher);
  const vendor = vendorData?.vendor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: { serviceDescription: '' },
  });

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function onSubmit(data: BookingFormData) {
    if (!data.eventId) { toast.error('Please select an event'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          eventId:            data.eventId,
          serviceDate:        data.serviceDate,
          serviceDescription: data.serviceDescription,
          notes:              data.budgetEstimate ? `Budget estimate: ₹${data.budgetEstimate}` : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to submit inquiry');
      }

      const { booking } = await res.json() as { booking: { id: string } };
      toast.success('Inquiry sent! The vendor will respond with a quote.');
      onSuccess?.(booking.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        variants={drawerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Book vendor"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pichwai-gold-100 px-6 py-4">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-900">
              Send Inquiry
            </h2>
            {vendor?.businessName && (
              <p className="text-sm text-pichwai-brown-400">{vendor.businessName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-pichwai-brown-400 hover:bg-pichwai-cream-100 hover:text-pichwai-brown-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 overflow-y-auto p-6 max-h-[70vh]">
          {/* Event selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-pichwai-brown-700">
              Select Event <span className="text-pichwai-saffron-500">*</span>
            </label>
            <select
              {...register('eventId', { required: 'Please select an event' })}
              className="w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2.5 text-sm text-pichwai-brown-800 focus:border-pichwai-gold-400 focus:outline-none"
            >
              <option value="">-- Choose your event --</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({new Date(e.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
                </option>
              ))}
            </select>
            {events.length === 0 && (
              <p className="mt-1 text-xs text-pichwai-brown-400">
                No events found.{' '}
                <Link href="/host/events/new" className="text-pichwai-gold-600 underline">Create one first →</Link>
              </p>
            )}
            {errors.eventId && <p className="mt-1 text-xs text-red-500">{errors.eventId.message}</p>}
          </div>

          {/* Service date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-pichwai-brown-700">
              <CalendarDays className="mb-0.5 mr-1 inline h-4 w-4 text-pichwai-gold-500" />
              Service Date <span className="text-pichwai-saffron-500">*</span>
            </label>
            <input
              type="date"
              {...register('serviceDate', { required: 'Please select a service date' })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2.5 text-sm text-pichwai-brown-800 focus:border-pichwai-gold-400 focus:outline-none"
            />
            {errors.serviceDate && <p className="mt-1 text-xs text-red-500">{errors.serviceDate.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-pichwai-brown-700">
              <FileText className="mb-0.5 mr-1 inline h-4 w-4 text-pichwai-gold-500" />
              Service Description
            </label>
            <textarea
              {...register('serviceDescription', { maxLength: 2000 })}
              rows={4}
              placeholder="Describe what you need — theme, style, guest count, special requirements…"
              className="w-full resize-none rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2.5 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none"
            />
          </div>

          {/* Budget estimate */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-pichwai-brown-700">
              <IndianRupee className="mb-0.5 mr-1 inline h-4 w-4 text-pichwai-gold-500" />
              Budget Estimate (₹)
            </label>
            <input
              type="number"
              {...register('budgetEstimate')}
              placeholder="e.g. 50000"
              min="0"
              className="w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2.5 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-3 font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              'Send Inquiry'
            )}
          </button>

          <p className="text-center text-xs text-pichwai-brown-400">
            The vendor will respond with a quote within {vendor?.responseTimeHours ?? 24} hours.
            No payment required now.
          </p>
        </form>
      </motion.div>
    </>
  );
}
