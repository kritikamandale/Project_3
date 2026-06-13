'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Building2, Camera, Package2, MapPin, FileCheck, CreditCard,
  CalendarDays, Plus, Trash2, Loader2, CheckCircle2, Upload,
} from 'lucide-react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { VENDOR_CATEGORIES } from '@/lib/constants/vendorCategories';
import { ALL_CITIES, INDIAN_STATES } from '@/lib/constants/indianCities';
import { cn } from '@/lib/utils/cn';
import { fadeInUp } from '@/lib/animations';

const EVENT_TYPES = [
  'wedding','birthday','anniversary','corporate','puja',
  'engagement','babyshower','housewarming','graduation','farewell',
];

const LANGUAGES = [
  'Hindi','English','Marathi','Gujarati','Tamil','Telugu',
  'Kannada','Bengali','Punjabi','Malayalam','Urdu','Other',
];

const SECTIONS = [
  { id: 'business',     label: 'Business Details',   icon: Building2 },
  { id: 'photos',       label: 'Photos & Gallery',   icon: Camera },
  { id: 'pricing',      label: 'Pricing & Packages', icon: Package2 },
  { id: 'service',      label: 'Service Areas',      icon: MapPin },
  { id: 'documents',    label: 'Documents',          icon: FileCheck },
  { id: 'bank',         label: 'Bank Details',       icon: CreditCard },
  { id: 'availability', label: 'Availability',       icon: CalendarDays },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

interface VendorFormData {
  businessName:     string;
  category:         string;
  tagline:          string;
  description:      string;
  city:             string;
  state:            string;
  phone:            string;
  whatsapp:         string;
  email:            string;
  websiteUrl:       string;
  instagramUrl:     string;
  priceStartingFrom:string;
  pricePerUnit:     string;
  priceRangeMax:    string;
  yearsExperience:  string;
  packages:  Array<{ name: string; price: string; inclusions: string }>;
  faq:       Array<{ question: string; answer: string }>;
  eventTypes:  string[];
  languages:   string[];
  serviceAreas:string[];
  gstin:       string;
  pan:         string;
  bankName:    string;
  accountNumber:string;
  ifsc:        string;
  accountHolder:string;
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

function useCompleteness(v: Partial<VendorFormData>): number {
  const checks = [
    !!v.businessName, !!v.category,
    !!(v.description && v.description.length > 50),
    !!v.city, !!v.phone, !!v.priceStartingFrom,
    (v.packages?.length ?? 0) > 0,
    (v.eventTypes?.length ?? 0) > 0,
    (v.languages?.length ?? 0) > 0,
    !!v.pan,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

const INPUT = 'w-full rounded-xl border border-pichwai-gold-200 bg-pichwai-cream-50 px-3 py-2.5 text-sm text-pichwai-brown-800 placeholder:text-pichwai-brown-300 focus:border-pichwai-gold-400 focus:outline-none';
const LABEL = 'mb-1.5 block text-sm font-medium text-pichwai-brown-700';

export default function VendorProfilePage() {
  const [section, setSection]   = useState<SectionId>('business');
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, mutate } = useSWR<{ vendor: Record<string, unknown> }>('/api/vendor/me', fetcher);
  const existing = data?.vendor;

  const {
    register, control, handleSubmit, watch, setValue, reset,
  } = useForm<VendorFormData>({
    defaultValues: {
      businessName: '', category: '', tagline: '', description: '',
      city: '', state: '', phone: '', whatsapp: '', email: '',
      websiteUrl: '', instagramUrl: '', priceStartingFrom: '',
      pricePerUnit: '', priceRangeMax: '', yearsExperience: '0',
      packages: [], faq: [],
      eventTypes: [], languages: [], serviceAreas: [],
      gstin: '', pan: '', bankName: '', accountNumber: '', ifsc: '', accountHolder: '',
    },
  });

  const { fields: pkgFields, append: addPkg, remove: rmPkg } = useFieldArray({ control, name: 'packages' });
  const { fields: faqFields, append: addFaq, remove: rmFaq } = useFieldArray({ control, name: 'faq' });

  useEffect(() => {
    if (!existing) return;
    const meta = (existing.metadata as Record<string, string[]>) ?? {};
    reset({
      businessName:     String(existing.businessName ?? ''),
      category:         String(existing.category ?? ''),
      tagline:          String(existing.tagline ?? ''),
      description:      String(existing.description ?? ''),
      city:             String(existing.city ?? ''),
      state:            String(existing.state ?? ''),
      phone:            String(existing.phone ?? ''),
      whatsapp:         String(existing.whatsapp ?? ''),
      email:            String(existing.email ?? ''),
      websiteUrl:       String(existing.websiteUrl ?? ''),
      instagramUrl:     String(existing.instagramUrl ?? ''),
      priceStartingFrom:String(existing.priceStartingFrom ?? ''),
      priceRangeMax:    String(existing.priceRangeMax ?? ''),
      pricePerUnit:     String(existing.pricePerUnit ?? ''),
      yearsExperience:  String(existing.yearsExperience ?? '0'),
      packages: (existing.packages as Array<{ name: string; price: string; inclusions: string }>) ?? [],
      faq:      (existing.faq as Array<{ question: string; answer: string }>) ?? [],
      eventTypes:  meta.eventTypes ?? [],
      languages:   meta.languages ?? [],
      serviceAreas:meta.serviceAreas ?? [],
      gstin:    String(meta.gstin ?? ''),
      pan:      String(meta.pan ?? ''),
      bankName: String(meta.bankName ?? ''),
      ifsc:     String(meta.ifsc ?? ''),
      accountHolder: String(meta.accountHolder ?? ''),
    });
  }, [existing, reset]);

  const fv = watch();
  const completeness = useCompleteness(fv);

  async function onSave(data: VendorFormData) {
    setSaving(true);
    try {
      const payload = {
        businessName:     data.businessName,
        category:         data.category,
        tagline:          data.tagline,
        description:      data.description,
        city:             data.city,
        state:            data.state,
        phone:            data.phone,
        whatsapp:         data.whatsapp,
        email:            data.email,
        websiteUrl:       data.websiteUrl,
        instagramUrl:     data.instagramUrl,
        priceStartingFrom:data.priceStartingFrom || null,
        priceRangeMax:    data.priceRangeMax || null,
        pricePerUnit:     data.pricePerUnit,
        yearsExperience:  Number(data.yearsExperience),
        packages: data.packages.map((p) => ({
          name: p.name,
          price: Number(p.price),
          inclusions: p.inclusions.split('\n').filter(Boolean),
        })),
        faq: data.faq,
        metadata: {
          ...((existing?.metadata as Record<string, unknown>) ?? {}),
          eventTypes:  data.eventTypes,
          languages:   data.languages,
          serviceAreas:data.serviceAreas,
          gstin:  data.gstin,
          pan:    data.pan,
          bankName: data.bankName,
          ifsc:     data.ifsc,
          accountHolder: data.accountHolder,
        },
      };

      const vendorId = existing?.id as string | undefined;
      const url   = vendorId ? `/api/vendors/${vendorId}` : '/api/vendor/create';
      const method = vendorId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('Profile saved!');
      mutate();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File, field: string) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'vendors');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };
      const vendorId = existing?.id as string | undefined;
      if (vendorId) {
        await fetch(`/api/vendors/${vendorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: url }),
        });
        mutate();
      }
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  function toggle(field: 'eventTypes' | 'languages', val: string) {
    const cur = (fv[field] as string[]) ?? [];
    setValue(field, cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]);
  }

  return (
    <div className="min-h-screen bg-pichwai-cream-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-pichwai-brown-900">Vendor Profile</h1>
          <p className="mt-1 text-pichwai-brown-500">Complete your profile to get discovered by hosts.</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSave)}>
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden w-60 shrink-0 lg:flex lg:flex-col gap-2">
              <div className="rounded-2xl border border-pichwai-gold-200 bg-white p-4 shadow-sm mb-4">
                <p className="text-xs font-semibold text-pichwai-brown-500 mb-2">Profile Completeness</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-pichwai-cream-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pichwai-gold-400 to-pichwai-saffron-500 transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className={cn('mt-1.5 text-sm font-bold', completeness === 100 ? 'text-green-600' : 'text-pichwai-brown-700')}>
                  {completeness}%
                  {completeness < 100 && <span className="ml-1 text-xs font-normal text-pichwai-brown-400"> — keep going!</span>}
                </p>
              </div>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition text-left',
                    section === s.id
                      ? 'bg-pichwai-gold-50 text-pichwai-gold-700 shadow-sm'
                      : 'text-pichwai-brown-600 hover:bg-pichwai-cream-100',
                  )}
                >
                  <s.icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              ))}
            </aside>

            <div className="flex-1 min-w-0">
              {/* Mobile tabs */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      section === s.id
                        ? 'border-pichwai-gold-500 bg-pichwai-gold-50 text-pichwai-gold-700'
                        : 'border-pichwai-gold-100 text-pichwai-brown-600',
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Mobile completeness */}
              <div className="mb-4 rounded-2xl border border-pichwai-gold-200 bg-white p-4 shadow-sm lg:hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-pichwai-brown-500">Completeness</p>
                  <p className="text-sm font-bold text-pichwai-brown-800">{completeness}%</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-pichwai-cream-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pichwai-gold-400 to-pichwai-saffron-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* ── BUSINESS ── */}
              {section === 'business' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Business Details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>Business Name *</label>
                      <input {...register('businessName', { required: true })} className={INPUT} placeholder="Krishna Moments Photography" /></div>
                    <div><label className={LABEL}>Category *</label>
                      <select {...register('category', { required: true })} className={INPUT}>
                        <option value="">Select category</option>
                        {VENDOR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                      </select></div>
                  </div>
                  <div><label className={LABEL}>Tagline</label>
                    <input {...register('tagline')} className={INPUT} placeholder="Capturing moments, creating memories" /></div>
                  <div><label className={LABEL}>Description *</label>
                    <textarea {...register('description', { required: true, minLength: 50 })} rows={5}
                      placeholder="Tell hosts about your business…"
                      className={cn(INPUT, 'resize-none')} />
                    <p className="mt-0.5 text-right text-xs text-pichwai-brown-400">{(fv.description ?? '').length}/2000</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>City *</label>
                      <select {...register('city', { required: true })} className={INPUT}>
                        <option value="">Select city</option>
                        {ALL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                    <div><label className={LABEL}>State *</label>
                      <select {...register('state', { required: true })} className={INPUT}>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select></div>
                    <div><label className={LABEL}>Phone *</label>
                      <input {...register('phone', { required: true })} className={INPUT} placeholder="+91 98765 43210" /></div>
                    <div><label className={LABEL}>WhatsApp</label>
                      <input {...register('whatsapp')} className={INPUT} placeholder="+91 98765 43210" /></div>
                    <div><label className={LABEL}>Business Email</label>
                      <input {...register('email')} type="email" className={INPUT} /></div>
                    <div><label className={LABEL}>Website</label>
                      <input {...register('websiteUrl')} className={INPUT} placeholder="https://" /></div>
                    <div><label className={LABEL}>Instagram</label>
                      <input {...register('instagramUrl')} className={INPUT} placeholder="https://instagram.com/you" /></div>
                    <div><label className={LABEL}>Years of Experience</label>
                      <input {...register('yearsExperience')} type="number" min="0" className={INPUT} /></div>
                  </div>
                </motion.section>
              )}

              {/* ── PHOTOS ── */}
              {section === 'photos' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-6">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Photos & Gallery</h2>
                  {[
                    { key: 'logoUrl', label: 'Business Logo', ratio: 'aspect-square w-32', hint: 'Square, min 200×200px' },
                    { key: 'coverImageUrl', label: 'Cover Photo', ratio: 'aspect-[3/1] w-full', hint: 'Landscape, min 1200×400px' },
                  ].map(({ key, label, ratio, hint }) => (
                    <div key={key}>
                      <label className={LABEL}>{label}</label>
                      <p className="mb-2 text-xs text-pichwai-brown-400">{hint}</p>
                      <div className={cn('relative overflow-hidden rounded-xl border-2 border-dashed border-pichwai-gold-200 bg-pichwai-cream-50', ratio)}>
                        {existing?.[key] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={String(existing[key])} alt={label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2">
                            <Upload className="h-8 w-8 text-pichwai-gold-300" />
                            <p className="text-sm text-pichwai-brown-400">Click to upload</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, key); }}
                        />
                        {uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <Loader2 className="h-8 w-8 animate-spin text-pichwai-gold-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-pichwai-brown-400">Gallery (up to 20 photos) can be managed after saving your profile.</p>
                </motion.section>
              )}

              {/* ── PRICING ── */}
              {section === 'pricing' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Pricing & Packages</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><label className={LABEL}>Starting Price (₹)</label>
                      <input {...register('priceStartingFrom')} type="number" min="0" className={INPUT} placeholder="15000" /></div>
                    <div><label className={LABEL}>Max Price (₹)</label>
                      <input {...register('priceRangeMax')} type="number" min="0" className={INPUT} placeholder="100000" /></div>
                    <div><label className={LABEL}>Price Per</label>
                      <input {...register('pricePerUnit')} className={INPUT} placeholder="event / day / hour" /></div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-pichwai-brown-700">Packages</p>
                      <button type="button" onClick={() => addPkg({ name: '', price: '', inclusions: '' })}
                        className="flex items-center gap-1 text-xs text-pichwai-gold-600 hover:text-pichwai-gold-700">
                        <Plus className="h-3.5 w-3.5" /> Add Package
                      </button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {pkgFields.map((f, i) => (
                        <div key={f.id} className="rounded-xl border border-pichwai-gold-100 bg-pichwai-cream-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold text-pichwai-brown-500">Package {i + 1}</p>
                            <button type="button" onClick={() => rmPkg(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div><label className="mb-1 block text-xs font-medium text-pichwai-brown-600">Name</label>
                              <input {...register(`packages.${i}.name`)} className={INPUT} placeholder="Basic Package" /></div>
                            <div><label className="mb-1 block text-xs font-medium text-pichwai-brown-600">Price (₹)</label>
                              <input {...register(`packages.${i}.price`)} type="number" className={INPUT} /></div>
                            <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-pichwai-brown-600">Inclusions (one per line)</label>
                              <textarea {...register(`packages.${i}.inclusions`)} rows={3}
                                placeholder="4 hour shoot&#10;200 edited photos&#10;Online gallery"
                                className={cn(INPUT, 'resize-none text-xs')} /></div>
                          </div>
                        </div>
                      ))}
                      {pkgFields.length === 0 && (
                        <p className="py-4 text-center text-sm text-pichwai-brown-400">No packages yet.</p>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── SERVICE AREAS ── */}
              {section === 'service' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-6">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Service Areas & Preferences</h2>
                  <div>
                    <label className={LABEL}>Event Types Served</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EVENT_TYPES.map((t) => (
                        <button type="button" key={t} onClick={() => toggle('eventTypes', t)}
                          className={cn('rounded-full border px-3 py-1 text-xs capitalize transition',
                            fv.eventTypes?.includes(t)
                              ? 'border-pichwai-gold-500 bg-pichwai-gold-50 font-semibold text-pichwai-gold-700'
                              : 'border-pichwai-gold-100 text-pichwai-brown-600 hover:border-pichwai-gold-300')}>
                          {t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Languages Spoken</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <button type="button" key={l} onClick={() => toggle('languages', l)}
                          className={cn('rounded-full border px-3 py-1 text-xs transition',
                            fv.languages?.includes(l)
                              ? 'border-pichwai-gold-500 bg-pichwai-gold-50 font-semibold text-pichwai-gold-700'
                              : 'border-pichwai-gold-100 text-pichwai-brown-600 hover:border-pichwai-gold-300')}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className={LABEL}>FAQ</label>
                      <button type="button" onClick={() => addFaq({ question: '', answer: '' })}
                        className="flex items-center gap-1 text-xs text-pichwai-gold-600 hover:text-pichwai-gold-700">
                        <Plus className="h-3.5 w-3.5" /> Add FAQ
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {faqFields.map((f, i) => (
                        <div key={f.id} className="rounded-xl border border-pichwai-gold-100 bg-pichwai-cream-50 p-4">
                          <div className="mb-2 flex justify-between">
                            <p className="text-xs font-semibold text-pichwai-brown-500">Q{i + 1}</p>
                            <button type="button" onClick={() => rmFaq(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
                          </div>
                          <input {...register(`faq.${i}.question`)} className={cn(INPUT, 'mb-2')} placeholder="Question" />
                          <textarea {...register(`faq.${i}.answer`)} rows={2} className={cn(INPUT, 'resize-none')} placeholder="Answer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── DOCUMENTS ── */}
              {section === 'documents' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Verification Documents</h2>
                  <p className="text-sm text-pichwai-brown-400">Reviewed by our team — stored securely, never shared publicly.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>GSTIN (optional)</label>
                      <input {...register('gstin')} className={INPUT} placeholder="22AAAAA0000A1Z5" /></div>
                    <div><label className={LABEL}>PAN Number</label>
                      <input {...register('pan')} className={INPUT} placeholder="ABCDE1234F" /></div>
                  </div>
                  {['PAN Card', 'Business Registration Certificate'].map((lbl) => (
                    <div key={lbl}>
                      <label className={LABEL}>{lbl}</label>
                      <div className="relative flex items-center gap-3 rounded-xl border border-dashed border-pichwai-gold-200 bg-pichwai-cream-50 px-4 py-3">
                        <Upload className="h-5 w-5 text-pichwai-gold-300" />
                        <p className="text-sm text-pichwai-brown-400">Upload PDF or image</p>
                        <input type="file" accept=".pdf,image/*" className="absolute inset-0 cursor-pointer opacity-0" />
                      </div>
                    </div>
                  ))}
                </motion.section>
              )}

              {/* ── BANK ── */}
              {section === 'bank' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Bank Account Details</h2>
                  <p className="text-sm text-pichwai-brown-400">Encrypted. Used only for payouts. Never shared with hosts.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>Account Holder Name</label>
                      <input {...register('accountHolder')} className={INPUT} /></div>
                    <div><label className={LABEL}>Bank Name</label>
                      <input {...register('bankName')} className={INPUT} placeholder="State Bank of India" /></div>
                    <div><label className={LABEL}>Account Number</label>
                      <input {...register('accountNumber')} type="password" autoComplete="off" className={INPUT} /></div>
                    <div><label className={LABEL}>IFSC Code</label>
                      <input {...register('ifsc')} className={INPUT} placeholder="SBIN0001234" /></div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-pichwai-blue-50 px-4 py-3 text-xs text-pichwai-blue-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Bank details are AES-256 encrypted at rest and never logged.
                  </div>
                </motion.section>
              )}

              {/* ── AVAILABILITY ── */}
              {section === 'availability' && (
                <motion.section variants={fadeInUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-pichwai-gold-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                  <h2 className="font-playfair text-xl font-semibold text-pichwai-brown-800">Availability Calendar</h2>
                  <p className="text-sm text-pichwai-brown-500">Mark dates when you're unavailable.</p>
                  <div className="rounded-xl border border-pichwai-gold-100 bg-pichwai-cream-50 p-8 text-center text-pichwai-brown-400">
                    <CalendarDays className="mx-auto mb-2 h-10 w-10 text-pichwai-gold-300" />
                    <p className="text-sm">Full calendar management coming soon.</p>
                    <p className="mt-1 text-xs">Mention unavailable periods in your description for now.</p>
                  </div>
                </motion.section>
              )}

              {/* Save */}
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pichwai-gold-500 to-pichwai-saffron-500 px-8 py-3 font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60">
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><CheckCircle2 className="h-4 w-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
