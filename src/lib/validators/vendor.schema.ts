import { z } from 'zod';

const VENDOR_CATEGORIES = [
  'catering', 'photography', 'decoration', 'venue', 'entertainment', 'music',
  'transport', 'mehendi', 'makeup', 'cake', 'invitation', 'flowers', 'tent',
  'light', 'security', 'event_planner', 'choreographer', 'anchor', 'priest', 'other',
] as const;

const PackageSchema = z.object({
  name:        z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  price:       z.number().min(0),
  inclusions:  z.array(z.string().max(200)).max(30).optional(),
});

// ─── Create vendor profile ────────────────────────────────────────────────────

export const VendorCreateSchema = z.object({
  businessName:       z.string().min(2).max(255),
  category:           z.enum(VENDOR_CATEGORIES),
  description:        z.string().max(5000).optional(),
  tagline:            z.string().max(255).optional(),
  city:               z.string().min(2).max(100),
  state:              z.string().min(2).max(100),
  phone:              z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  whatsapp:           z.string().regex(/^[6-9]\d{9}$/).optional(),
  email:              z.string().email().toLowerCase().optional(),
  websiteUrl:         z.string().url().optional(),
  instagramUrl:       z.string().url().optional(),
  priceStartingFrom:  z.number().min(0).optional(),
  priceRangeMax:      z.number().min(0).optional(),
  pricePerUnit:       z.string().max(100).optional(),
  yearsExperience:    z.number().int().min(0).max(100).default(0),
  servicesOffered:    z.array(z.string().max(100)).max(20).optional(),
  eventTypesServed:   z.array(z.string().max(50)).max(20).optional(),
  packages:           z.array(PackageSchema).max(10).optional(),
  faq:                z.array(z.object({
    question: z.string().max(500),
    answer:   z.string().max(2000),
  })).max(20).optional(),
});

export type VendorCreateInput = z.infer<typeof VendorCreateSchema>;

// ─── Update (all fields optional) ────────────────────────────────────────────

export const VendorUpdateSchema = VendorCreateSchema
  .omit({ category: true })
  .partial();

export type VendorUpdateInput = z.infer<typeof VendorUpdateSchema>;

// ─── List query ───────────────────────────────────────────────────────────────

export const VendorListQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(50).default(12),
  category:   z.string().optional(),
  city:       z.string().max(100).optional(),
  minPrice:   z.coerce.number().min(0).optional(),
  maxPrice:   z.coerce.number().min(0).optional(),
  search:     z.string().max(100).optional(),
  sortBy:     z.enum(['rating', 'price', 'reviews', 'createdAt']).default('rating'),
  sortOrder:  z.enum(['asc', 'desc']).default('desc'),
  verified:   z.coerce.boolean().optional(),
  featured:   z.coerce.boolean().optional(),
});

export type VendorListQuery = z.infer<typeof VendorListQuerySchema>;

// ─── Review schema ────────────────────────────────────────────────────────────

export const VendorReviewSchema = z.object({
  rating:     z.number().int().min(1).max(5),
  title:      z.string().min(3).max(255).optional(),
  reviewText: z.string().min(10).max(2000).optional(),
  bookingId:  z.string().uuid().optional(),
});

export type VendorReviewInput = z.infer<typeof VendorReviewSchema>;
