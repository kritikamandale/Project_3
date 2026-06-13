'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Star, Send } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface ReviewFormData {
  rating: number;
  title: string;
  reviewText: string;
}

interface ReviewFormProps {
  vendorId:  string;
  bookingId: string;
  eventId:   string;
  onSuccess: () => void;
}

export function ReviewForm({ vendorId, bookingId, eventId, onSuccess }: ReviewFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewFormData>();

  async function onSubmit(data: ReviewFormData) {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rating, bookingId, eventId }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      toast.success('Review submitted!');
      onSuccess();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Star rating */}
      <div>
        <p className="mb-2 text-sm font-medium text-pichwai-brown-700">Your Rating</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            return (
              <button
                key={val}
                type="button"
                onMouseEnter={() => setHoveredStar(val)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(val)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-7 w-7 transition-colors',
                    val <= (hoveredStar || rating)
                      ? 'fill-pichwai-gold-400 text-pichwai-gold-400'
                      : 'fill-transparent text-pichwai-brown-200',
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-pichwai-brown-700">
          Review Title
        </label>
        <input
          {...register('title', { maxLength: 255 })}
          placeholder="Great photographer!"
          className="w-full rounded-lg border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none"
        />
      </div>

      {/* Body */}
      <div>
        <label className="mb-1 block text-sm font-medium text-pichwai-brown-700">
          Your Review <span className="text-pichwai-saffron-500">*</span>
        </label>
        <textarea
          {...register('reviewText', { required: 'Please write a review', minLength: { value: 20, message: 'Minimum 20 characters' } })}
          rows={4}
          placeholder="Share details about your experience…"
          className="w-full resize-none rounded-lg border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none"
        />
        {errors.reviewText && (
          <p className="mt-1 text-xs text-red-500">{errors.reviewText.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
