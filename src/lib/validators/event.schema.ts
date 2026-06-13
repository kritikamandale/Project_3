import { z } from 'zod';

const EVENT_TYPE_VALUES = [
  'wedding', 'birthday', 'kiddie_party', 'farewell', 'family_meetup',
  'anniversary', 'corporate', 'puja', 'engagement', 'babyshower',
  'housewarming', 'graduation', 'festive', 'kitty_party', 'social', 'other',
] as const;

const EVENT_STATUS_VALUES = [
  'draft', 'published', 'ongoing', 'completed', 'cancelled',
] as const;

// ─── Create ───────────────────────────────────────────────────────────────────

export const EventCreateSchema = z.object({
  title:               z.string().min(3).max(255),
  description:         z.string().max(5000).optional(),
  eventType:           z.enum(EVENT_TYPE_VALUES),
  eventDate:           z.string().min(1),
  eventTime:           z.string().optional(),
  endDate:             z.string().optional(),
  endTime:             z.string().optional(),
  venueName:           z.string().max(255).optional(),
  venueAddress:        z.string().optional(),
  venueCity:           z.string().max(100).optional(),
  venueState:          z.string().max(100).optional(),
  venuePincode:        z.string().max(10).optional(),
  venueGoogleMapsUrl:  z.string().optional(),
  venueLat:            z.number().optional(),
  venueLng:            z.number().optional(),
  expectedGuests:      z.number().int().min(1).max(100000).default(50),
  totalBudget:         z.number().min(0).default(0),
  coverImageUrl:       z.string().optional(),
  theme:               z.string().max(100).optional(),
  dresscode:           z.string().max(255).optional(),
  specialInstructions: z.string().optional(),
  isPrivate:           z.boolean().default(true),
  templateId:          z.string().optional(),
  budgetCategories: z.array(z.object({
    name:       z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
});

export type EventCreateInput = z.infer<typeof EventCreateSchema>;

// ─── Update (all fields optional except status transitions) ───────────────────

export const EventUpdateSchema = z.object({
  title:               z.string().min(3).max(255).optional(),
  description:         z.string().max(5000).optional(),
  eventDate:           z.string().optional(),
  eventTime:           z.string().optional(),
  endDate:             z.string().optional(),
  endTime:             z.string().optional(),
  venueName:           z.string().max(255).optional(),
  venueAddress:        z.string().optional(),
  venueCity:           z.string().max(100).optional(),
  venueState:          z.string().max(100).optional(),
  venuePincode:        z.string().max(10).optional(),
  venueGoogleMapsUrl:  z.string().optional(),
  venueLat:            z.number().optional(),
  venueLng:            z.number().optional(),
  expectedGuests:      z.number().int().min(1).max(100000).optional(),
  totalBudget:         z.number().min(0).optional(),
  coverImageUrl:       z.string().optional(),
  theme:               z.string().max(100).optional(),
  dresscode:           z.string().max(255).optional(),
  specialInstructions: z.string().optional(),
  isPrivate:           z.boolean().optional(),
  status:              z.enum(EVENT_STATUS_VALUES).optional(),
  checklist:           z.array(z.unknown()).optional(),
  timeline:            z.array(z.unknown()).optional(),
  cancellationReason:  z.string().optional(),
});

export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;

// ─── List query params ─────────────────────────────────────────────────────────

export const EventListQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(50).default(10),
  status:    z.enum(EVENT_STATUS_VALUES).optional(),
  eventType: z.string().optional(),
  search:    z.string().optional(),
  sortBy:    z.enum(['createdAt', 'eventDate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type EventListQuery = z.infer<typeof EventListQuerySchema>;

// ─── Checklist task item ───────────────────────────────────────────────────────

export const ChecklistItemSchema = z.object({
  id:            z.string(),
  title:         z.string().min(1).max(255),
  category:      z.string(),
  dueOffsetDays: z.number().optional(),
  dueDate:       z.string().optional(),
  priority:      z.enum(['low', 'medium', 'high']),
  completed:     z.boolean().default(false),
  assignedTo:    z.string().optional(),
  notes:         z.string().optional(),
  sortOrder:     z.number().optional(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const TaskUpdateSchema = z.object({
  checklist: z.array(ChecklistItemSchema),
});

export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
