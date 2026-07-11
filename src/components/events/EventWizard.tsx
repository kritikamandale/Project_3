'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as SliderPrimitive from '@radix-ui/react-slider';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { EVENT_TYPES, EVENT_TYPE_TEMPLATES } from '@/lib/constants/eventTypes';
import type { BudgetCategoryTemplate } from '@/lib/constants/eventTypes';

// ─── Wizard form schema ───────────────────────────────────────────────────────

const wizardSchema = z.object({
  eventType:      z.string().min(1),
  title:          z.string().min(3).max(255),
  description:    z.string().max(5000).optional(),
  expectedGuests: z.number().int().min(1).max(100000),
  coverImageUrl:  z.string().optional(),
  dresscode:      z.string().max(255).optional(),
  theme:          z.string().max(100).optional(),
  eventDate:      z.string().min(1),
  eventTime:      z.string().optional(),
  endDate:        z.string().optional(),
  endTime:        z.string().optional(),
  venueName:      z.string().optional(),
  venueAddress:   z.string().optional(),
  venueCity:      z.string().optional(),
  venueState:     z.string().optional(),
  venuePincode:   z.string().max(10).optional(),
  totalBudget:    z.number().min(0),
  isPrivate:      z.boolean(),
});

type WizardFormData = z.infer<typeof wizardSchema>;

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ['eventType'],
  ['title', 'expectedGuests'],
  ['eventDate'],
  ['totalBudget'],
  [],
];

const STEPS = ['Event Type', 'Basic Details', 'Date & Venue', 'Budget', 'Review'];
const STORAGE_KEY = 'milap_wizard_draft';

// Chart color palette
const CHART_COLORS = [
  '#C9933A', '#E8A93C', '#D4AF37', '#B8890C', '#8B6914',
  '#F4A825', '#FF9A3C', '#C2185B', '#9C27B0', '#006994',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function buildConicGradient(categories: BudgetCategoryTemplate[]): string {
  let cumulative = 0;
  return categories
    .map((cat, i) => {
      const start = cumulative;
      cumulative += cat.percentage;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      return `${color} ${start}% ${cumulative}%`;
    })
    .join(', ');
}

function getCsrfToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith('milap_csrf='))
    ?.split('=')[1];
}

// ─── Sub-step components ──────────────────────────────────────────────────────

function Step1EventType({ form }: { form: UseFormReturn<WizardFormData> }) {
  const { watch, setValue, formState: { errors } } = form;
  const selected = watch('eventType');

  return (
    <div>
      <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: '#2D1B00' }}>
        What are you celebrating?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5C3A1E' }}>
        Select the type of event you&apos;re planning
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {EVENT_TYPES.map((et) => (
          <motion.button
            key={et.value}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setValue('eventType', et.value, { shouldValidate: true })}
            className={cn(
              'p-3 rounded-xl border-2 text-center transition-all cursor-pointer select-none',
              selected === et.value
                ? 'border-pichwai-gold bg-pichwai-gold/10 shadow-md'
                : 'border-[#5C0A38]/30 hover:border-pichwai-gold/50 hover:bg-pichwai-cream/40',
            )}
          >
            <div className="text-2xl mb-1">{et.icon}</div>
            <div className="text-xs font-medium text-[#5C0A38] leading-tight">{et.label}</div>
          </motion.button>
        ))}
      </div>

      {errors.eventType && (
        <p className="mt-3 text-sm text-red-500">Please select an event type</p>
      )}
    </div>
  );
}

function Step2BasicDetails({
  form,
  uploadingImage,
  onImageUpload,
  fileInputRef,
}: {
  form: UseFormReturn<WizardFormData>;
  uploadingImage: boolean;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { register, watch, formState: { errors } } = form;
  const coverImageUrl = watch('coverImageUrl');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: '#2D1B00' }}>
          Basic Details
        </h2>
        <p className="text-sm mb-6" style={{ color: '#5C3A1E' }}>Tell us about your event</p>
      </div>

      {/* Event title */}
      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          placeholder="e.g. Sharma Family Wedding 2026"
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40',
            errors.title ? 'border-red-400' : 'border-[#5C0A38]/30',
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Share details about your event, what guests can expect..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40 resize-none"
        />
      </div>

      {/* Guest count + dresscode row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            Expected Guests <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('expectedGuests', { valueAsNumber: true })}
            min={1}
            max={100000}
            placeholder="50"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40',
              errors.expectedGuests ? 'border-red-400' : 'border-[#5C0A38]/30',
            )}
          />
          {errors.expectedGuests && (
            <p className="mt-1 text-xs text-red-500">{errors.expectedGuests.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            Dress Code
          </label>
          <input
            {...register('dresscode')}
            placeholder="e.g. Indian Traditional"
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">Theme</label>
        <input
          {...register('theme')}
          placeholder="e.g. Royal Rajasthani, Garden Party, Pichwai Art..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
        />
      </div>

      {/* Cover image upload */}
      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-2">
          Cover Image
        </label>
        {coverImageUrl ? (
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-pichwai-gold/30">
            <Image src={coverImageUrl} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <button
              type="button"
              onClick={() => form.setValue('coverImageUrl', '')}
              className="absolute top-2 right-2 bg-white/90/80 text-red-500 rounded-lg px-2 py-1 text-xs font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-full h-28 border-2 border-dashed border-pichwai-gold/30 rounded-xl flex flex-col items-center justify-center text-[#5C0A38]/50 hover:border-pichwai-gold/60 hover:text-[#5C0A38] transition-colors"
          >
            {uploadingImage ? (
              <span className="text-sm">Uploading…</span>
            ) : (
              <>
                <span className="text-2xl">📸</span>
                <span className="text-sm mt-1">Click to upload cover photo</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageUpload}
        />
      </div>

      {/* Privacy toggle */}
      <div className="flex items-center gap-3">
        <Controller
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors',
                field.value ? 'bg-pichwai-gold' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white/90 rounded-full shadow transition-transform',
                  field.value ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          )}
        />
        <span className="text-sm text-[#5C0A38]">
          Private event (guests join via invite link only)
        </span>
      </div>
    </div>
  );
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

function Step3DateVenue({ form }: { form: UseFormReturn<WizardFormData> }) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: '#2D1B00' }}>
          Date & Venue
        </h2>
        <p className="text-sm mb-6" style={{ color: '#5C3A1E' }}>When and where is the event?</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            Event Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('eventDate')}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40',
              errors.eventDate ? 'border-red-400' : 'border-[#5C0A38]/30',
            )}
          />
          {errors.eventDate && (
            <p className="mt-1 text-xs text-red-500">Date is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            Start Time
          </label>
          <input
            type="time"
            {...register('eventTime')}
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            End Date (optional)
          </label>
          <input
            type="date"
            {...register('endDate')}
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">
            End Time
          </label>
          <input
            type="time"
            {...register('endTime')}
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">
          Venue Name
        </label>
        <input
          {...register('venueName')}
          placeholder="e.g. The Grand Ballroom, Taj Hotel, Home"
          className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">
          Full Address
        </label>
        <textarea
          {...register('venueAddress')}
          rows={2}
          placeholder="Street, Colony, Landmark..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40 resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">City</label>
          <input
            {...register('venueCity')}
            placeholder="e.g. Mumbai, Delhi, Jaipur"
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5C0A38] mb-1">Pincode</label>
          <input
            {...register('venuePincode')}
            maxLength={6}
            placeholder="400001"
            className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5C0A38] mb-1">State</label>
        <select
          {...register('venueState')}
          className="w-full px-4 py-2.5 rounded-xl border border-[#5C0A38]/30 bg-white/90 text-[#5C0A38] focus:outline-none focus:ring-2 focus:ring-pichwai-gold/40"
        >
          <option value="">Select state…</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Step4Budget({
  form,
  budgetCategories,
  setBudgetCategories,
}: {
  form: UseFormReturn<WizardFormData>;
  budgetCategories: BudgetCategoryTemplate[];
  setBudgetCategories: (c: BudgetCategoryTemplate[]) => void;
}) {
  const { watch, setValue } = form;
  const totalBudget = watch('totalBudget') ?? 50000;

  const totalPct = budgetCategories.reduce((s, c) => s + c.percentage, 0);

  const updatePct = (index: number, pct: number) => {
    const updated = [...budgetCategories];
    updated[index] = { ...updated[index], percentage: Math.max(0, Math.min(100, pct)) };
    setBudgetCategories(updated);
  };

  const gradientStr = buildConicGradient(budgetCategories);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: '#2D1B00' }}>
          Budget Planning
        </h2>
        <p className="text-sm mb-6" style={{ color: '#5C3A1E' }}>
          Set your total budget and allocate across categories
        </p>
      </div>

      {/* Total budget slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#5C0A38]">Total Budget</label>
          <span className="text-lg font-bold" style={{ color: '#2D1B00' }}>
            {formatCurrency(totalBudget)}
          </span>
        </div>

        <SliderPrimitive.Root
          min={5000}
          max={5000000}
          step={5000}
          value={[totalBudget]}
          onValueChange={([v]) => setValue('totalBudget', v)}
          className="relative flex items-center select-none touch-none w-full h-5"
        >
          <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-2">
            <SliderPrimitive.Range className="absolute bg-gradient-to-r from-pichwai-saffron to-pichwai-gold rounded-full h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block w-5 h-5 bg-white/90 border-2 border-pichwai-gold rounded-full shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-pichwai-gold/50 transition-shadow" />
        </SliderPrimitive.Root>

        <div className="flex justify-between text-xs text-[#5C0A38]/70 mt-1">
          <span>₹5K</span>
          <span>₹50L</span>
        </div>
      </div>

      {/* Budget breakdown */}
      {budgetCategories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mt-4">
          {/* Category list */}
          <div className="sm:col-span-3 space-y-2">
            {budgetCategories.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-xs text-[#5C0A38] flex-1 truncate">{cat.name}</span>
                <input
                  type="number"
                  value={cat.percentage}
                  min={0}
                  max={100}
                  onChange={(e) => updatePct(i, Number(e.target.value))}
                  className="w-14 text-center text-xs border border-[#5C0A38]/30 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-pichwai-gold/40"
                />
                <span className="text-xs text-[#5C0A38]/70 w-4">%</span>
                <span className="text-xs font-medium text-[#5C0A38] w-14 text-right">
                  {formatCurrency(Math.round((cat.percentage / 100) * totalBudget))}
                </span>
              </div>
            ))}
            {totalPct !== 100 && (
              <p className={cn('text-xs mt-1', totalPct > 100 ? 'text-red-500' : 'text-amber-500')}>
                Total: {totalPct}% {totalPct > 100 ? '(over by ' + (totalPct - 100) + '%)' : '(' + (100 - totalPct) + '% unallocated)'}
              </p>
            )}
          </div>

          {/* Pie chart (conic-gradient) */}
          <div className="sm:col-span-2 flex items-center justify-center">
            <div
              className="w-36 h-36 rounded-full shadow-inner"
              style={{ background: `conic-gradient(${gradientStr})` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Step5Review({
  form,
  budgetCategories,
}: {
  form: UseFormReturn<WizardFormData>;
  budgetCategories: BudgetCategoryTemplate[];
}) {
  const values = form.getValues();
  const eventTypeInfo = EVENT_TYPES.find((e) => e.value === values.eventType);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: '#2D1B00' }}>
          Review Your Event
        </h2>
        <p className="text-sm mb-6" style={{ color: '#5C3A1E' }}>
          Everything looks good? Save as draft or publish to go live.
        </p>
      </div>

      <div className="space-y-3">
        {/* Type + title */}
        <ReviewRow
          label="Event"
          value={
            <span className="flex items-center gap-2">
              <span>{eventTypeInfo?.icon}</span>
              <span className="font-medium">{values.title || '—'}</span>
              {eventTypeInfo && (
                <span className="text-xs bg-pichwai-gold/10 px-2 py-0.5 rounded-full" style={{ color: '#2D1B00' }}>
                  {eventTypeInfo.label}
                </span>
              )}
            </span>
          }
        />

        {/* Date */}
        <ReviewRow
          label="Date"
          value={
            values.eventDate
              ? `${values.eventDate}${values.eventTime ? ' at ' + values.eventTime : ''}${values.endDate ? ' → ' + values.endDate : ''}`
              : '—'
          }
        />

        {/* Venue */}
        <ReviewRow
          label="Venue"
          value={[values.venueName, values.venueCity, values.venueState]
            .filter(Boolean)
            .join(', ') || '—'}
        />

        {/* Guests */}
        <ReviewRow label="Expected Guests" value={values.expectedGuests?.toString() ?? '—'} />

        {/* Budget */}
        <ReviewRow
          label="Total Budget"
          value={
            <span className="font-semibold" style={{ color: '#2D1B00' }}>
              {formatCurrency(values.totalBudget ?? 0)}
            </span>
          }
        />

        {/* Dress code + theme */}
        {(values.dresscode || values.theme) && (
          <ReviewRow
            label="Style"
            value={[values.dresscode && `Dress: ${values.dresscode}`, values.theme && `Theme: ${values.theme}`]
              .filter(Boolean)
              .join(' · ')}
          />
        )}

        {/* Privacy */}
        <ReviewRow
          label="Privacy"
          value={values.isPrivate ? '🔒 Private (invite only)' : '🌐 Public'}
        />

        {/* Cover image */}
        {values.coverImageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden h-32 border border-pichwai-gold/20 relative">
            <Image
              src={values.coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', color: 'rgba(45, 27, 0, 0.8)' }}>
        <p className="font-medium mb-1" style={{ color: '#2D1B00' }}>What happens next?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Your event checklist will be auto-generated from the template</li>
          <li>A unique invite link & QR code will be created</li>
          <li>You can add guests, assign vendors, and track budget anytime</li>
        </ul>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs w-28 flex-shrink-0 pt-0.5" style={{ color: 'rgba(92, 10, 56, 0.8)' }}>{label}</span>
      <span className="text-sm flex-1" style={{ color: '#2D1B00' }}>{value}</span>
    </div>
  );
}

// ─── Main EventWizard ─────────────────────────────────────────────────────────

export default function EventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryTemplate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      eventType:      '',
      title:          '',
      description:    '',
      expectedGuests: 50,
      coverImageUrl:  '',
      dresscode:      '',
      theme:          '',
      eventDate:      '',
      eventTime:      '',
      endDate:        '',
      endTime:        '',
      venueName:      '',
      venueAddress:   '',
      venueCity:      '',
      venueState:     '',
      venuePincode:   '',
      totalBudget:    50000,
      isPrivate:      true,
    },
  });

  const { watch, setValue } = form;
  const eventType   = watch('eventType');
  const allValues   = watch();

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as { budgetCategories?: BudgetCategoryTemplate[] } & Partial<WizardFormData>;
      const { budgetCategories: savedBudget, ...formData } = data;
      (Object.entries(formData) as [keyof WizardFormData, unknown][]).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          setValue(k, v as WizardFormData[typeof k]);
        }
      });
      if (savedBudget?.length) setBudgetCategories(savedBudget);
    } catch {
      // corrupted draft — ignore
    }
  }, [setValue]);

  // Persist to localStorage whenever form values change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...allValues, budgetCategories }));
    } catch {}
  }, [allValues, budgetCategories]);

  // Seed budget categories from template when event type is chosen
  useEffect(() => {
    if (!eventType) return;
    const template = EVENT_TYPE_TEMPLATES[eventType];
    if (template && budgetCategories.length === 0) {
      setBudgetCategories(template.defaultBudgetCategories);
    }
  }, [eventType, budgetCategories.length, setBudgetCategories]);

  const validateStep = useCallback(async (): Promise<boolean> => {
    const fields = STEP_FIELDS[step];
    if (!fields.length) return true;
    return form.trigger(fields);
  }, [step, form]);

  const goNext = async () => {
    if (!(await validateStep())) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  // Cover image upload via /api/upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'event-covers');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json() as { url?: string };
      if (data.url) setValue('coverImageUrl', data.url);
      else throw new Error('No URL in response');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (publishStatus: 'draft' | 'published') => {
    if (!(await form.trigger())) return;
    setIsSubmitting(true);

    try {
      const values = form.getValues();
      const csrf   = getCsrfToken();

      const res = await fetch('/api/events', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({
          ...values,
          status:           publishStatus,
          budgetCategories: budgetCategories,
          templateId:       values.eventType,
        }),
      });

      if (!res.ok) {
        const payload = await res.json() as { error?: string };
        throw new Error(payload.error ?? 'Failed to create event');
      }

      const { event } = await res.json() as { event: { id: string } };
      localStorage.removeItem(STORAGE_KEY);
      toast.success(publishStatus === 'published' ? '🎉 Event published!' : 'Draft saved!');
      router.push(`/host/events/${event.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Framer Motion slide variants
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir < 0 ? '60%' : '-60%', opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C0A38]/95 via-[#7A0D4A]/80 to-[#3A0623]/95 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      i < step  ? 'bg-pichwai-gold text-white shadow-md'       :
                      i === step ? 'bg-pichwai-saffron text-white ring-4 ring-pichwai-saffron/20' :
                      'bg-[#D4AF37]/10 text-[#D4AF37]/70',
                    )}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={cn(
                    'text-xs mt-1 hidden sm:block',
                    i === step ? 'text-pichwai-saffron font-medium' : 'text-[#D4AF37]/70',
                  )}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-[-1.4rem] transition-colors',
                      i < step ? 'bg-pichwai-gold' : 'bg-[#5C0A38]/20',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step card */}
        <div className="bg-gradient-to-r from-[#D4AF37] to-[#E8C06B] border border-[#B8860B] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 sm:p-8"
              >
                {step === 0 && <Step1EventType form={form} />}
                {step === 1 && (
                  <Step2BasicDetails
                    form={form}
                    uploadingImage={uploadingImage}
                    onImageUpload={handleImageUpload}
                    fileInputRef={fileInputRef}
                  />
                )}
                {step === 2 && <Step3DateVenue form={form} />}
                {step === 3 && (
                  <Step4Budget
                    form={form}
                    budgetCategories={budgetCategories}
                    setBudgetCategories={setBudgetCategories}
                  />
                )}
                {step === 4 && (
                  <Step5Review form={form} budgetCategories={budgetCategories} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation bar */}
          <div className="px-6 sm:px-8 pb-6 flex items-center justify-between border-t border-[#5C0A38]/20 pt-4">
            <button
              type="button"
              onClick={goPrev}
              className={cn(
                'px-5 py-2.5 rounded-xl border border-[#5C0A38]/30 text-[#5C0A38] text-sm font-medium hover:bg-[#5C0A38]/10 transition-colors',
                step === 0 && 'invisible',
              )}
            >
              ← Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-pichwai-gold text-[#5C0A38] text-sm font-medium hover:bg-pichwai-gold/5 disabled:opacity-50 transition-colors"
                >
                  Save Draft
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pichwai-saffron to-pichwai-gold text-white text-sm font-semibold shadow-md disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? 'Publishing…' : '🚀 Publish Event'}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Clear draft link */}
        <p className="text-center mt-4 text-xs text-[#D4AF37]/70">
          Draft auto-saved.{' '}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              form.reset();
              setBudgetCategories([]);
              setStep(0);
            }}
            className="underline hover:text-[#D4AF37] transition-colors"
          >
            Clear draft
          </button>
        </p>
      </div>
    </div>
  );
}
