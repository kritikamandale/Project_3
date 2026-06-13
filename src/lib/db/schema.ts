import {
  pgTable, pgEnum, uuid, varchar, text, boolean,
  integer, decimal, timestamp, date, time, inet,
  jsonb, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================
export const userRoleEnum          = pgEnum('user_role',          ['super_admin','host','vendor','guest']);
export const eventTypeEnum         = pgEnum('event_type',         ['wedding','birthday','kiddie_party','farewell','family_meetup','anniversary','corporate','puja','engagement','babyshower','housewarming','graduation','festive','kitty_party','social','other']);
export const eventStatusEnum       = pgEnum('event_status',       ['draft','published','ongoing','completed','cancelled']);
export const rsvpStatusEnum        = pgEnum('rsvp_status',        ['pending','confirmed','declined','maybe','waitlist','checked_in']);
export const vendorCategoryEnum    = pgEnum('vendor_category',    ['catering','photography','decoration','venue','entertainment','music','transport','mehendi','makeup','cake','invitation','flowers','tent','light','security','event_planner','choreographer','anchor','priest','other']);
export const bookingStatusEnum     = pgEnum('booking_status',     ['inquiry','quoted','confirmed','in_progress','completed','cancelled','disputed']);
export const paymentStatusEnum     = pgEnum('payment_status',     ['pending','processing','completed','failed','refunded']);
export const paymentMethodEnum     = pgEnum('payment_method',     ['upi','card','netbanking','wallet','cash','emi']);
export const inviteChannelEnum     = pgEnum('invite_channel',     ['whatsapp','sms','email','link']);
export const notificationTypeEnum  = pgEnum('notification_type',  ['invite','rsvp_update','payment','booking','reminder','system','ai_suggestion']);
export const planTypeEnum          = pgEnum('plan_type',          ['free','basic','premium','enterprise']);
export const verificationStatusEnum= pgEnum('verification_status',['pending','verified','rejected','suspended']);
export const taskPriorityEnum      = pgEnum('task_priority',      ['low','medium','high','urgent']);
export const taskStatusEnum        = pgEnum('task_status',        ['todo','in_progress','done','blocked']);
export const guestSideEnum         = pgEnum('guest_side',         ['bride','groom','both','neutral']);
export const mealPrefEnum          = pgEnum('meal_pref',          ['veg','non_veg','vegan','jain','no_preference']);

// =============================================================================
// USERS
// =============================================================================
export const users = pgTable('users', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  email:                   varchar('email', { length: 255 }).notNull().unique(),
  phone:                   varchar('phone', { length: 15 }).unique(),
  fullName:                varchar('full_name', { length: 255 }).notNull(),
  avatarUrl:               text('avatar_url'),
  role:                    userRoleEnum('role').notNull().default('host'),
  plan:                    planTypeEnum('plan').notNull().default('free'),
  isActive:                boolean('is_active').notNull().default(true),
  isEmailVerified:         boolean('is_email_verified').notNull().default(false),
  isPhoneVerified:         boolean('is_phone_verified').notNull().default(false),
  emailVerificationToken:  varchar('email_verification_token', { length: 255 }),
  phoneOtp:                varchar('phone_otp', { length: 6 }),
  otpExpiresAt:            timestamp('otp_expires_at', { withTimezone: true }),
  passwordHash:            varchar('password_hash', { length: 255 }),
  lastLoginAt:             timestamp('last_login_at', { withTimezone: true }),
  lastLoginIp:             inet('last_login_ip'),
  failedLoginAttempts:     integer('failed_login_attempts').notNull().default(0),
  lockedUntil:             timestamp('locked_until', { withTimezone: true }),
  preferredLanguage:       varchar('preferred_language', { length: 10 }).default('en'),
  city:                    varchar('city', { length: 100 }),
  state:                   varchar('state', { length: 100 }),
  country:                 varchar('country', { length: 100 }).default('India'),
  firebaseUid:             varchar('firebase_uid', { length: 255 }).unique(),
  googleId:                varchar('google_id', { length: 255 }).unique(),
  metadata:                jsonb('metadata').notNull().default({}),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:               timestamp('deleted_at', { withTimezone: true }),
});

// =============================================================================
// USER SESSIONS
// =============================================================================
export const userSessions = pgTable('user_sessions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull().unique(),
  deviceInfo:       jsonb('device_info').notNull().default({}),
  ipAddress:        inet('ip_address'),
  userAgent:        text('user_agent'),
  isValid:          boolean('is_valid').notNull().default(true),
  expiresAt:        timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// EVENTS
// =============================================================================
export const events = pgTable('events', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  slug:                varchar('slug', { length: 255 }).notNull().unique(),
  hostId:              uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:               varchar('title', { length: 255 }).notNull(),
  description:         text('description'),
  eventType:           eventTypeEnum('event_type').notNull(),
  status:              eventStatusEnum('status').notNull().default('draft'),
  eventDate:           date('event_date').notNull(),
  eventTime:           time('event_time'),
  endDate:             date('end_date'),
  endTime:             time('end_time'),
  venueName:           varchar('venue_name', { length: 255 }),
  venueAddress:        text('venue_address'),
  venueCity:           varchar('venue_city', { length: 100 }),
  venueState:          varchar('venue_state', { length: 100 }),
  venuePincode:        varchar('venue_pincode', { length: 10 }),
  venueGoogleMapsUrl:  text('venue_google_maps_url'),
  venueLat:            decimal('venue_lat', { precision: 9, scale: 6 }),
  venueLng:            decimal('venue_lng', { precision: 9, scale: 6 }),
  expectedGuests:      integer('expected_guests').notNull().default(0),
  confirmedGuests:     integer('confirmed_guests').notNull().default(0),
  totalBudget:         decimal('total_budget', { precision: 12, scale: 2 }).notNull().default('0'),
  spentBudget:         decimal('spent_budget', { precision: 12, scale: 2 }).notNull().default('0'),
  coverImageUrl:       text('cover_image_url'),
  theme:               varchar('theme', { length: 100 }),
  dresscode:           varchar('dress_code', { length: 255 }),
  specialInstructions: text('special_instructions'),
  isPrivate:           boolean('is_private').notNull().default(true),
  inviteToken:         varchar('invite_token', { length: 64 }).notNull().unique(),
  inviteQrUrl:         text('invite_qr_url'),
  templateId:          varchar('template_id', { length: 50 }),
  checklist:           jsonb('checklist').notNull().default([]),
  timeline:            jsonb('timeline').notNull().default([]),
  seatingLayout:       jsonb('seating_layout').notNull().default({}),
  customFields:        jsonb('custom_fields').notNull().default({}),
  metadata:            jsonb('metadata').notNull().default({}),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:           timestamp('deleted_at', { withTimezone: true }),
});

// =============================================================================
// EVENT TASKS
// =============================================================================
export const eventTasks = pgTable('event_tasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  eventId:     uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status:      taskStatusEnum('status').notNull().default('todo'),
  priority:    taskPriorityEnum('priority').notNull().default('medium'),
  assignedTo:  uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  dueDate:     date('due_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  sortOrder:   integer('sort_order').notNull().default(0),
  metadata:    jsonb('metadata').notNull().default({}),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// GUESTS
// =============================================================================
export const guests = pgTable('guests', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  eventId:            uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId:             uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName:           varchar('full_name', { length: 255 }).notNull(),
  email:              varchar('email', { length: 255 }),
  phone:              varchar('phone', { length: 15 }),
  rsvpStatus:         rsvpStatusEnum('rsvp_status').notNull().default('pending'),
  rsvpRespondedAt:    timestamp('rsvp_responded_at', { withTimezone: true }),
  plusOne:            boolean('plus_one').notNull().default(false),
  plusOneName:        varchar('plus_one_name', { length: 255 }),
  mealPreference:     mealPrefEnum('meal_preference').default('no_preference'),
  dietaryRestrictions:text('dietary_restrictions'),
  side:               guestSideEnum('side').default('neutral'),
  relation:           varchar('relation', { length: 100 }),
  groupName:          varchar('group_name', { length: 100 }),
  tableNumber:        integer('table_number'),
  seatNumber:         integer('seat_number'),
  inviteSentAt:       timestamp('invite_sent_at', { withTimezone: true }),
  inviteToken:        varchar('invite_token', { length: 64 }).unique(),
  checkInAt:          timestamp('check_in_at', { withTimezone: true }),
  checkInBy:          uuid('check_in_by').references(() => users.id),
  specialNotes:       text('special_notes'),
  isVip:              boolean('is_vip').notNull().default(false),
  giftRegistered:     boolean('gift_registered').notNull().default(false),
  consentGiven:       boolean('consent_given').notNull().default(false),
  metadata:           jsonb('metadata').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// VENDORS
// =============================================================================
export const vendors = pgTable('vendors', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  userId:                uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  businessName:          varchar('business_name', { length: 255 }).notNull(),
  slug:                  varchar('slug', { length: 255 }).notNull().unique(),
  category:              vendorCategoryEnum('category').notNull(),
  description:           text('description'),
  tagline:               varchar('tagline', { length: 255 }),
  logoUrl:               text('logo_url'),
  coverImageUrl:         text('cover_image_url'),
  city:                  varchar('city', { length: 100 }).notNull(),
  state:                 varchar('state', { length: 100 }).notNull(),
  phone:                 varchar('phone', { length: 15 }).notNull(),
  whatsapp:              varchar('whatsapp', { length: 15 }),
  email:                 varchar('email', { length: 255 }),
  websiteUrl:            text('website_url'),
  instagramUrl:          text('instagram_url'),
  priceStartingFrom:     decimal('price_starting_from', { precision: 10, scale: 2 }),
  pricePerUnit:          varchar('price_per_unit', { length: 100 }),
  priceRangeMax:         decimal('price_range_max', { precision: 10, scale: 2 }),
  currency:              varchar('currency', { length: 3 }).notNull().default('INR'),
  advanceRequiredPercent:integer('advance_required_percent').notNull().default(30),
  yearsExperience:       integer('years_experience').notNull().default(0),
  totalEventsDone:       integer('total_events_done').notNull().default(0),
  averageRating:         decimal('average_rating', { precision: 3, scale: 2 }).notNull().default('0'),
  totalReviews:          integer('total_reviews').notNull().default(0),
  isVerified:            verificationStatusEnum('is_verified').notNull().default('pending'),
  isActive:              boolean('is_active').notNull().default(true),
  isFeatured:            boolean('is_featured').notNull().default(false),
  responseTimeHours:     integer('response_time_hours').notNull().default(24),
  packages:              jsonb('packages').notNull().default([]),
  faq:                   jsonb('faq').notNull().default([]),
  pineconeVectorId:      varchar('pinecone_vector_id', { length: 255 }),
  metadata:              jsonb('metadata').notNull().default({}),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:             timestamp('deleted_at', { withTimezone: true }),
});

// =============================================================================
// VENDOR REVIEWS
// =============================================================================
export const vendorReviews = pgTable('vendor_reviews', {
  id:                uuid('id').primaryKey().defaultRandom(),
  vendorId:          uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  reviewerId:        uuid('reviewer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId:           uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  bookingId:         uuid('booking_id'),
  rating:            integer('rating').notNull(),
  title:             varchar('title', { length: 255 }),
  reviewText:        text('review_text'),
  isVerifiedBooking: boolean('is_verified_booking').notNull().default(false),
  helpfulCount:      integer('helpful_count').notNull().default(0),
  vendorResponse:    text('vendor_response'),
  vendorRespondedAt: timestamp('vendor_responded_at', { withTimezone: true }),
  isPublished:       boolean('is_published').notNull().default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// BOOKINGS
// =============================================================================
export const bookings = pgTable('bookings', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  eventId:            uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  vendorId:           uuid('vendor_id').notNull().references(() => vendors.id),
  hostId:             uuid('host_id').notNull().references(() => users.id),
  status:             bookingStatusEnum('status').notNull().default('inquiry'),
  serviceDate:        date('service_date').notNull(),
  serviceDescription: text('service_description'),
  quotedAmount:       decimal('quoted_amount', { precision: 12, scale: 2 }),
  finalAmount:        decimal('final_amount', { precision: 12, scale: 2 }),
  advanceAmount:      decimal('advance_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  advancePaid:        boolean('advance_paid').notNull().default(false),
  notes:              text('notes'),
  vendorNotes:        text('vendor_notes'),
  contractUrl:        text('contract_url'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt:        timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy:        uuid('cancelled_by').references(() => users.id),
  completedAt:        timestamp('completed_at', { withTimezone: true }),
  metadata:           jsonb('metadata').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// PAYMENTS
// =============================================================================
export const payments = pgTable('payments', {
  id:                uuid('id').primaryKey().defaultRandom(),
  bookingId:         uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  eventId:           uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  payerId:           uuid('payer_id').notNull().references(() => users.id),
  payeeId:           uuid('payee_id').references(() => users.id),
  razorpayOrderId:   varchar('razorpay_order_id', { length: 255 }).unique(),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }).unique(),
  razorpaySignature: varchar('razorpay_signature', { length: 512 }),
  amount:            decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency:          varchar('currency', { length: 3 }).notNull().default('INR'),
  method:            paymentMethodEnum('method'),
  status:            paymentStatusEnum('status').notNull().default('pending'),
  description:       text('description'),
  refundId:          varchar('refund_id', { length: 255 }),
  refundAmount:      decimal('refund_amount', { precision: 12, scale: 2 }),
  refundedAt:        timestamp('refunded_at', { withTimezone: true }),
  invoiceUrl:        text('invoice_url'),
  receiptUrl:        text('receipt_url'),
  metadata:          jsonb('metadata').notNull().default({}),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// BUDGET ITEMS
// =============================================================================
export const budgetItems = pgTable('budget_items', {
  id:              uuid('id').primaryKey().defaultRandom(),
  eventId:         uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  category:        varchar('category', { length: 100 }).notNull(),
  itemName:        varchar('item_name', { length: 255 }).notNull(),
  estimatedAmount: decimal('estimated_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  actualAmount:    decimal('actual_amount', { precision: 12, scale: 2 }).default('0'),
  isPaid:          boolean('is_paid').notNull().default(false),
  paymentId:       uuid('payment_id').references(() => payments.id),
  vendorId:        uuid('vendor_id').references(() => vendors.id),
  bookingId:       uuid('booking_id').references(() => bookings.id),
  notes:           text('notes'),
  receiptUrl:      text('receipt_url'),
  dueDate:         date('due_date'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// EVENT MEMORIES
// =============================================================================
export const eventMemories = pgTable('event_memories', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  eventId:            uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  uploadedBy:         uuid('uploaded_by').notNull().references(() => users.id),
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull().unique(),
  url:                text('url').notNull(),
  thumbnailUrl:       text('thumbnail_url'),
  caption:            text('caption'),
  isCover:            boolean('is_cover').notNull().default(false),
  isHighlight:        boolean('is_highlight').notNull().default(false),
  width:              integer('width'),
  height:             integer('height'),
  fileSize:           integer('file_size'),
  mimeType:           varchar('mime_type', { length: 50 }),
  tags:               jsonb('tags').notNull().default([]),
  likesCount:         integer('likes_count').notNull().default(0),
  metadata:           jsonb('metadata').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// NOTIFICATIONS
// =============================================================================
export const notifications = pgTable('notifications', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:             notificationTypeEnum('type').notNull(),
  title:            varchar('title', { length: 255 }).notNull(),
  body:             text('body').notNull(),
  data:             jsonb('data').notNull().default({}),
  isRead:           boolean('is_read').notNull().default(false),
  readAt:           timestamp('read_at', { withTimezone: true }),
  actionUrl:        text('action_url'),
  firebaseMessageId:varchar('firebase_message_id', { length: 255 }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// AUDIT LOGS
// =============================================================================
export const auditLogs = pgTable('audit_logs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action:       varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId:   uuid('resource_id'),
  oldData:      jsonb('old_data'),
  newData:      jsonb('new_data'),
  ipAddress:    inet('ip_address'),
  userAgent:    text('user_agent'),
  success:      boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  metadata:     jsonb('metadata').notNull().default({}),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// AI CHAT HISTORY
// =============================================================================
export const aiChatHistory = pgTable('ai_chat_history', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId:   uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  role:      varchar('role', { length: 20 }).notNull(),
  content:   text('content').notNull(),
  tokens:    integer('tokens'),
  model:     varchar('model', { length: 100 }),
  metadata:  jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// RELATIONS (for Drizzle query builder)
// =============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  sessions:      many(userSessions),
  events:        many(events),
  guests:        many(guests),
  vendors:       many(vendors),
  bookings:      many(bookings),
  reviews:       many(vendorReviews),
  notifications: many(notifications),
  auditLogs:     many(auditLogs),
  aiChats:       many(aiChatHistory),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host:       one(users,    { fields: [events.hostId],    references: [users.id] }),
  guests:     many(guests),
  tasks:      many(eventTasks),
  bookings:   many(bookings),
  budgetItems:many(budgetItems),
  memories:   many(eventMemories),
  reviews:    many(vendorReviews),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  event: one(events, { fields: [guests.eventId], references: [events.id] }),
  user:  one(users,  { fields: [guests.userId],  references: [users.id] }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user:     one(users,  { fields: [vendors.userId],   references: [users.id] }),
  bookings: many(bookings),
  reviews:  many(vendorReviews),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  event:    one(events,   { fields: [bookings.eventId],  references: [events.id] }),
  vendor:   one(vendors,  { fields: [bookings.vendorId], references: [vendors.id] }),
  host:     one(users,    { fields: [bookings.hostId],   references: [users.id] }),
  payments: many(payments),
}));
