import { z } from 'zod';

export const MEAL_PREFS    = ['veg', 'non_veg', 'vegan', 'jain', 'no_preference'] as const;
export const RSVP_STATUSES = ['pending', 'confirmed', 'declined', 'maybe', 'waitlist', 'checked_in'] as const;
export const SIDES         = ['bride', 'groom', 'both', 'neutral'] as const;
export const CHANNELS      = ['whatsapp', 'sms', 'email'] as const;

export const GuestCreateSchema = z.object({
  fullName:            z.string().min(1).max(255),
  email:               z.string().max(255).optional(),
  phone:               z.string().max(15).optional(),
  plusOne:             z.boolean().default(false),
  plusOneName:         z.string().max(255).optional(),
  mealPreference:      z.enum(MEAL_PREFS).default('no_preference'),
  dietaryRestrictions: z.string().optional(),
  side:                z.enum(SIDES).default('neutral'),
  relation:            z.string().max(100).optional(),
  groupName:           z.string().max(100).optional(),
  isVip:               z.boolean().default(false),
  specialNotes:        z.string().optional(),
  tableNumber:         z.number().int().optional(),
  seatNumber:          z.number().int().optional(),
});

export type GuestCreateInput = z.infer<typeof GuestCreateSchema>;

export const GuestUpdateSchema = z.object({
  fullName:            z.string().min(1).max(255).optional(),
  email:               z.string().max(255).optional(),
  phone:               z.string().max(15).optional(),
  plusOne:             z.boolean().optional(),
  plusOneName:         z.string().max(255).optional(),
  mealPreference:      z.enum(MEAL_PREFS).optional(),
  dietaryRestrictions: z.string().optional(),
  side:                z.enum(SIDES).optional(),
  relation:            z.string().max(100).optional(),
  groupName:           z.string().max(100).optional(),
  isVip:               z.boolean().optional(),
  specialNotes:        z.string().optional(),
  tableNumber:         z.number().int().nullable().optional(),
  seatNumber:          z.number().int().nullable().optional(),
  rsvpStatus:          z.enum(RSVP_STATUSES).optional(),
});

export type GuestUpdateInput = z.infer<typeof GuestUpdateSchema>;

export const RSVPSchema = z.object({
  rsvpStatus:          z.enum(['confirmed', 'declined', 'maybe']),
  fullName:            z.string().min(1).max(255).optional(),
  plusOne:             z.boolean().default(false),
  plusOneName:         z.string().max(255).optional(),
  mealPreference:      z.enum(MEAL_PREFS).default('no_preference'),
  dietaryRestrictions: z.string().optional(),
  consentGiven:        z.boolean().default(true),
});

export type RSVPInput = z.infer<typeof RSVPSchema>;

export const SendInvitesSchema = z.object({
  guestIds:        z.array(z.string()).min(1),
  channels:        z.array(z.enum(CHANNELS)).min(1),
  personalMessage: z.string().max(500).optional(),
});

export type SendInvitesInput = z.infer<typeof SendInvitesSchema>;

export const GuestListQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(500).default(100),
  rsvpStatus: z.enum(RSVP_STATUSES).optional(),
  groupName:  z.string().optional(),
  search:     z.string().optional(),
});

export type GuestListQuery = z.infer<typeof GuestListQuerySchema>;

export const BulkImportRowSchema = z.object({
  fullName:   z.string().min(1).max(255),
  email:      z.string().max(255).optional(),
  phone:      z.string().max(15).optional(),
  side:       z.enum(SIDES).default('neutral'),
  relation:   z.string().max(100).optional(),
  groupName:  z.string().max(100).optional(),
  plusOne:    z.coerce.boolean().default(false),
});

export type BulkImportRow = z.infer<typeof BulkImportRowSchema>;
