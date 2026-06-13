-- =============================================================================
-- EventNest — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- DPDP Act 2023 aware: PII stored encrypted / hashed where noted
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM (
  'super_admin', 'host', 'vendor', 'guest'
);

CREATE TYPE event_type AS ENUM (
  'wedding', 'birthday', 'kiddie_party', 'farewell',
  'family_meetup', 'anniversary', 'corporate', 'puja',
  'engagement', 'babyshower', 'housewarming', 'graduation',
  'festive', 'kitty_party', 'social', 'other'
);

CREATE TYPE event_status AS ENUM (
  'draft', 'published', 'ongoing', 'completed', 'cancelled'
);

CREATE TYPE rsvp_status AS ENUM (
  'pending', 'confirmed', 'declined', 'maybe', 'waitlist', 'checked_in'
);

CREATE TYPE vendor_category AS ENUM (
  'catering', 'photography', 'decoration', 'venue',
  'entertainment', 'music', 'transport', 'mehendi',
  'makeup', 'cake', 'invitation', 'flowers', 'tent',
  'light', 'security', 'event_planner', 'choreographer',
  'anchor', 'priest', 'other'
);

CREATE TYPE booking_status AS ENUM (
  'inquiry', 'quoted', 'confirmed', 'in_progress',
  'completed', 'cancelled', 'disputed'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'upi', 'card', 'netbanking', 'wallet', 'cash', 'emi'
);

CREATE TYPE invite_channel AS ENUM (
  'whatsapp', 'sms', 'email', 'link'
);

CREATE TYPE notification_type AS ENUM (
  'invite', 'rsvp_update', 'payment', 'booking',
  'reminder', 'system', 'ai_suggestion'
);

CREATE TYPE plan_type AS ENUM (
  'free', 'basic', 'premium', 'enterprise'
);

CREATE TYPE verification_status AS ENUM (
  'pending', 'verified', 'rejected', 'suspended'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE guest_side    AS ENUM ('bride', 'groom', 'both', 'neutral');
CREATE TYPE meal_pref     AS ENUM ('veg', 'non_veg', 'vegan', 'jain', 'no_preference');

-- =============================================================================
-- USERS TABLE
-- PII: email, phone, full_name, avatar_url — handled per DPDP Act 2023
-- =============================================================================
CREATE TABLE users (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     VARCHAR(255) UNIQUE NOT NULL,
  phone                     VARCHAR(15)  UNIQUE,
  full_name                 VARCHAR(255) NOT NULL,
  avatar_url                TEXT,
  role                      user_role    NOT NULL DEFAULT 'host',
  plan                      plan_type    NOT NULL DEFAULT 'free',
  is_active                 BOOLEAN      NOT NULL DEFAULT true,
  is_email_verified         BOOLEAN      NOT NULL DEFAULT false,
  is_phone_verified         BOOLEAN      NOT NULL DEFAULT false,
  email_verification_token  VARCHAR(255),
  phone_otp                 VARCHAR(6),
  otp_expires_at            TIMESTAMPTZ,
  -- password stored as bcrypt hash (cost ≥ 12)
  password_hash             VARCHAR(255),
  last_login_at             TIMESTAMPTZ,
  last_login_ip             INET,
  failed_login_attempts     INTEGER      NOT NULL DEFAULT 0,
  locked_until              TIMESTAMPTZ,
  preferred_language        VARCHAR(10)  DEFAULT 'en',
  city                      VARCHAR(100),
  state                     VARCHAR(100),
  country                   VARCHAR(100) DEFAULT 'India',
  firebase_uid              VARCHAR(255) UNIQUE,
  google_id                 VARCHAR(255) UNIQUE,
  metadata                  JSONB        NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX idx_users_email           ON users(email)        WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone           ON users(phone)        WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role            ON users(role)         WHERE deleted_at IS NULL;
CREATE INDEX idx_users_firebase_uid    ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX idx_users_plan            ON users(plan)         WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at      ON users(created_at DESC);

-- =============================================================================
-- USER SESSIONS TABLE
-- refresh_token stored as SHA-256 hash — raw token never persisted
-- =============================================================================
CREATE TABLE user_sessions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info         JSONB        NOT NULL DEFAULT '{}',
  ip_address          INET,
  user_agent          TEXT,
  is_valid            BOOLEAN      NOT NULL DEFAULT true,
  expires_at          TIMESTAMPTZ  NOT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id    ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at) WHERE is_valid = true;

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================
CREATE TABLE events (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  VARCHAR(255)  UNIQUE NOT NULL,
  host_id               UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                 VARCHAR(255)  NOT NULL,
  description           TEXT,
  event_type            event_type    NOT NULL,
  status                event_status  NOT NULL DEFAULT 'draft',
  event_date            DATE          NOT NULL,
  event_time            TIME,
  end_date              DATE,
  end_time              TIME,
  venue_name            VARCHAR(255),
  venue_address         TEXT,
  venue_city            VARCHAR(100),
  venue_state           VARCHAR(100),
  venue_pincode         VARCHAR(10),
  venue_google_maps_url TEXT,
  venue_lat             DECIMAL(9,6),
  venue_lng             DECIMAL(9,6),
  expected_guests       INTEGER       NOT NULL DEFAULT 0,
  confirmed_guests      INTEGER       NOT NULL DEFAULT 0,
  total_budget          DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_budget          DECIMAL(12,2) NOT NULL DEFAULT 0,
  cover_image_url       TEXT,
  theme                 VARCHAR(100),
  dress_code            VARCHAR(255),
  special_instructions  TEXT,
  is_private            BOOLEAN       NOT NULL DEFAULT true,
  -- invite_token: URL-safe random hex, used for guest invite links
  invite_token          VARCHAR(64)   UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invite_qr_url         TEXT,
  template_id           VARCHAR(50),
  checklist             JSONB         NOT NULL DEFAULT '[]',
  timeline              JSONB         NOT NULL DEFAULT '[]',
  seating_layout        JSONB         NOT NULL DEFAULT '{}',
  custom_fields         JSONB         NOT NULL DEFAULT '{}',
  metadata              JSONB         NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_events_host_id      ON events(host_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_events_event_date   ON events(event_date)  WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status       ON events(status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_events_invite_token ON events(invite_token);
CREATE INDEX idx_events_slug         ON events(slug);
CREATE INDEX idx_events_city         ON events(venue_city)  WHERE deleted_at IS NULL;
CREATE INDEX idx_events_type         ON events(event_type)  WHERE deleted_at IS NULL;

-- =============================================================================
-- EVENT TASKS TABLE
-- =============================================================================
CREATE TABLE event_tasks (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title        VARCHAR(255)  NOT NULL,
  description  TEXT,
  status       task_status   NOT NULL DEFAULT 'todo',
  priority     task_priority NOT NULL DEFAULT 'medium',
  assigned_to  UUID          REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  sort_order   INTEGER       NOT NULL DEFAULT 0,
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_event_id ON event_tasks(event_id);
CREATE INDEX idx_tasks_status   ON event_tasks(event_id, status);
CREATE INDEX idx_tasks_due_date ON event_tasks(due_date) WHERE status != 'done';

-- =============================================================================
-- GUESTS TABLE
-- PII: full_name, email, phone — DPDP Act consent tracked via metadata
-- =============================================================================
CREATE TABLE guests (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id              UUID          REFERENCES users(id) ON DELETE SET NULL,
  full_name            VARCHAR(255)  NOT NULL,
  email                VARCHAR(255),
  phone                VARCHAR(15),
  rsvp_status          rsvp_status   NOT NULL DEFAULT 'pending',
  rsvp_responded_at    TIMESTAMPTZ,
  plus_one             BOOLEAN       NOT NULL DEFAULT false,
  plus_one_name        VARCHAR(255),
  meal_preference      meal_pref     DEFAULT 'no_preference',
  dietary_restrictions TEXT,
  side                 guest_side    DEFAULT 'neutral',
  relation             VARCHAR(100),
  group_name           VARCHAR(100),
  table_number         INTEGER,
  seat_number          INTEGER,
  invite_sent_via      invite_channel[],
  invite_sent_at       TIMESTAMPTZ,
  invite_token         VARCHAR(64)   UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  check_in_at          TIMESTAMPTZ,
  check_in_by          UUID          REFERENCES users(id),
  special_notes        TEXT,
  is_vip               BOOLEAN       NOT NULL DEFAULT false,
  gift_registered      BOOLEAN       NOT NULL DEFAULT false,
  -- DPDP: consent_given=true required before sending marketing comms
  consent_given        BOOLEAN       NOT NULL DEFAULT false,
  metadata             JSONB         NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guests_event_id    ON guests(event_id);
CREATE INDEX idx_guests_rsvp        ON guests(event_id, rsvp_status);
CREATE INDEX idx_guests_phone       ON guests(phone)        WHERE phone IS NOT NULL;
CREATE INDEX idx_guests_email       ON guests(email)        WHERE email IS NOT NULL;
CREATE INDEX idx_guests_invite_token ON guests(invite_token);
CREATE INDEX idx_guests_check_in    ON guests(event_id, check_in_at) WHERE check_in_at IS NOT NULL;

-- =============================================================================
-- VENDORS TABLE
-- =============================================================================
CREATE TABLE vendors (
  id                       UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name            VARCHAR(255)        NOT NULL,
  slug                     VARCHAR(255)        UNIQUE NOT NULL,
  category                 vendor_category     NOT NULL,
  sub_categories           TEXT[]              NOT NULL DEFAULT '{}',
  description              TEXT,
  tagline                  VARCHAR(255),
  logo_url                 TEXT,
  cover_image_url          TEXT,
  gallery_urls             TEXT[]              NOT NULL DEFAULT '{}',
  city                     VARCHAR(100)        NOT NULL,
  state                    VARCHAR(100)        NOT NULL,
  service_areas            TEXT[]              NOT NULL DEFAULT '{}',
  phone                    VARCHAR(15)         NOT NULL,
  whatsapp                 VARCHAR(15),
  email                    VARCHAR(255),
  website_url              TEXT,
  instagram_url            TEXT,
  price_starting_from      DECIMAL(10,2),
  price_per_unit           VARCHAR(100),
  price_range_max          DECIMAL(10,2),
  currency                 VARCHAR(3)          NOT NULL DEFAULT 'INR',
  advance_required_percent INTEGER             NOT NULL DEFAULT 30
                                               CHECK (advance_required_percent BETWEEN 0 AND 100),
  event_types_served       event_type[]        NOT NULL DEFAULT '{}',
  languages_spoken         TEXT[]              NOT NULL DEFAULT '{Hindi,English}',
  years_experience         INTEGER             NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
  total_events_done        INTEGER             NOT NULL DEFAULT 0 CHECK (total_events_done >= 0),
  average_rating           DECIMAL(3,2)        NOT NULL DEFAULT 0
                                               CHECK (average_rating BETWEEN 0 AND 5),
  total_reviews            INTEGER             NOT NULL DEFAULT 0,
  is_verified              verification_status NOT NULL DEFAULT 'pending',
  verification_documents   JSONB               NOT NULL DEFAULT '{}',
  gstin                    VARCHAR(15),
  pan                      VARCHAR(10),
  -- bank_account_details encrypted at app layer before storing
  bank_account_details     JSONB               NOT NULL DEFAULT '{}',
  is_active                BOOLEAN             NOT NULL DEFAULT true,
  is_featured              BOOLEAN             NOT NULL DEFAULT false,
  response_time_hours      INTEGER             NOT NULL DEFAULT 24,
  availability_calendar    JSONB               NOT NULL DEFAULT '{}',
  packages                 JSONB               NOT NULL DEFAULT '[]',
  faq                      JSONB               NOT NULL DEFAULT '[]',
  pinecone_vector_id       VARCHAR(255),
  metadata                 JSONB               NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ
);

CREATE INDEX idx_vendors_category    ON vendors(category)       WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_vendors_city        ON vendors(city)           WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_vendors_rating      ON vendors(average_rating DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_slug        ON vendors(slug);
CREATE INDEX idx_vendors_user_id     ON vendors(user_id);
CREATE INDEX idx_vendors_verified    ON vendors(is_verified)    WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_featured    ON vendors(is_featured)    WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_vendors_price       ON vendors(price_starting_from) WHERE deleted_at IS NULL;
-- Full-text trigram search on business name
CREATE INDEX idx_vendors_search      ON vendors USING gin(business_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_desc_search ON vendors USING gin(description  gin_trgm_ops) WHERE deleted_at IS NULL AND description IS NOT NULL;

-- =============================================================================
-- VENDOR REVIEWS TABLE
-- =============================================================================
CREATE TABLE vendor_reviews (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  reviewer_id         UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  event_id            UUID        REFERENCES events(id)           ON DELETE SET NULL,
  booking_id          UUID,
  rating              INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title               VARCHAR(255),
  review_text         TEXT,
  photos              TEXT[]      NOT NULL DEFAULT '{}',
  is_verified_booking BOOLEAN     NOT NULL DEFAULT false,
  helpful_count       INTEGER     NOT NULL DEFAULT 0,
  vendor_response     TEXT,
  vendor_responded_at TIMESTAMPTZ,
  is_published        BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, reviewer_id, event_id)
);

CREATE INDEX idx_reviews_vendor_id  ON vendor_reviews(vendor_id)        WHERE is_published = true;
CREATE INDEX idx_reviews_rating     ON vendor_reviews(vendor_id, rating) WHERE is_published = true;
CREATE INDEX idx_reviews_reviewer   ON vendor_reviews(reviewer_id);

-- =============================================================================
-- BOOKINGS TABLE
-- =============================================================================
CREATE TABLE bookings (
  id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             UUID            NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  vendor_id            UUID            NOT NULL REFERENCES vendors(id),
  host_id              UUID            NOT NULL REFERENCES users(id),
  status               booking_status  NOT NULL DEFAULT 'inquiry',
  service_date         DATE            NOT NULL,
  service_description  TEXT,
  quoted_amount        DECIMAL(12,2),
  final_amount         DECIMAL(12,2),
  advance_amount       DECIMAL(12,2)   NOT NULL DEFAULT 0,
  advance_paid         BOOLEAN         NOT NULL DEFAULT false,
  -- computed: balance = final_amount - advance_amount
  balance_amount       DECIMAL(12,2)   GENERATED ALWAYS AS
                         (COALESCE(final_amount, 0) - COALESCE(advance_amount, 0)) STORED,
  notes                TEXT,
  vendor_notes         TEXT,
  contract_url         TEXT,
  cancellation_reason  TEXT,
  cancelled_at         TIMESTAMPTZ,
  cancelled_by         UUID            REFERENCES users(id),
  completed_at         TIMESTAMPTZ,
  metadata             JSONB           NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_event_id  ON bookings(event_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_host_id   ON bookings(host_id);
CREATE INDEX idx_bookings_status    ON bookings(status);
CREATE INDEX idx_bookings_date      ON bookings(service_date);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
CREATE TABLE payments (
  id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID            REFERENCES bookings(id) ON DELETE SET NULL,
  event_id             UUID            REFERENCES events(id)   ON DELETE SET NULL,
  payer_id             UUID            NOT NULL REFERENCES users(id),
  payee_id             UUID            REFERENCES users(id),
  razorpay_order_id    VARCHAR(255)    UNIQUE,
  razorpay_payment_id  VARCHAR(255)    UNIQUE,
  razorpay_signature   VARCHAR(512),
  amount               DECIMAL(12,2)   NOT NULL CHECK (amount > 0),
  currency             VARCHAR(3)      NOT NULL DEFAULT 'INR',
  method               payment_method,
  status               payment_status  NOT NULL DEFAULT 'pending',
  description          TEXT,
  refund_id            VARCHAR(255),
  refund_amount        DECIMAL(12,2),
  refunded_at          TIMESTAMPTZ,
  invoice_url          TEXT,
  receipt_url          TEXT,
  metadata             JSONB           NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id     ON payments(booking_id)          WHERE booking_id IS NOT NULL;
CREATE INDEX idx_payments_payer_id       ON payments(payer_id);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id)   WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_payments_status         ON payments(status);
CREATE INDEX idx_payments_created_at     ON payments(created_at DESC);

-- =============================================================================
-- BUDGET ITEMS TABLE
-- =============================================================================
CREATE TABLE budget_items (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category         VARCHAR(100)  NOT NULL,
  item_name        VARCHAR(255)  NOT NULL,
  estimated_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (estimated_amount >= 0),
  actual_amount    DECIMAL(12,2)           DEFAULT 0 CHECK (actual_amount >= 0),
  is_paid          BOOLEAN       NOT NULL DEFAULT false,
  payment_id       UUID          REFERENCES payments(id),
  vendor_id        UUID          REFERENCES vendors(id),
  booking_id       UUID          REFERENCES bookings(id),
  notes            TEXT,
  receipt_url      TEXT,
  due_date         DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_event_id  ON budget_items(event_id);
CREATE INDEX idx_budget_category  ON budget_items(event_id, category);
CREATE INDEX idx_budget_is_paid   ON budget_items(event_id, is_paid);

-- =============================================================================
-- EVENT MEMORIES / PHOTOS TABLE
-- =============================================================================
CREATE TABLE event_memories (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by         UUID        NOT NULL REFERENCES users(id),
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  url                 TEXT        NOT NULL,
  thumbnail_url       TEXT,
  caption             TEXT,
  is_cover            BOOLEAN     NOT NULL DEFAULT false,
  is_highlight        BOOLEAN     NOT NULL DEFAULT false,
  width               INTEGER,
  height              INTEGER,
  file_size           INTEGER,
  mime_type           VARCHAR(50),
  tags                TEXT[]      NOT NULL DEFAULT '{}',
  likes_count         INTEGER     NOT NULL DEFAULT 0,
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memories_event_id    ON event_memories(event_id);
CREATE INDEX idx_memories_uploaded_by ON event_memories(uploaded_by);
CREATE INDEX idx_memories_highlight   ON event_memories(event_id, is_highlight) WHERE is_highlight = true;
CREATE INDEX idx_memories_cover       ON event_memories(event_id, is_cover)     WHERE is_cover = true;

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE notifications (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                notification_type NOT NULL,
  title               VARCHAR(255)      NOT NULL,
  body                TEXT              NOT NULL,
  data                JSONB             NOT NULL DEFAULT '{}',
  is_read             BOOLEAN           NOT NULL DEFAULT false,
  read_at             TIMESTAMPTZ,
  action_url          TEXT,
  firebase_message_id VARCHAR(255),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at  ON notifications(created_at DESC);

-- =============================================================================
-- AUDIT LOGS TABLE — immutable security trail
-- =============================================================================
CREATE TABLE audit_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id   UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  success       BOOLEAN      NOT NULL DEFAULT true,
  error_message TEXT,
  metadata      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Append-only: no UPDATE/DELETE on audit_logs
CREATE INDEX idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_action     ON audit_logs(action);
CREATE INDEX idx_audit_resource   ON audit_logs(resource_type, resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- AI CHAT HISTORY TABLE
-- =============================================================================
CREATE TABLE ai_chat_history (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   UUID        REFERENCES events(id) ON DELETE SET NULL,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT        NOT NULL,
  tokens     INTEGER,
  model      VARCHAR(100),
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_user_id  ON ai_chat_history(user_id, created_at DESC);
CREATE INDEX idx_ai_chat_event_id ON ai_chat_history(event_id) WHERE event_id IS NOT NULL;

-- =============================================================================
-- TRIGGER FUNCTION: auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'events', 'event_tasks', 'guests', 'vendors',
    'vendor_reviews', 'bookings', 'payments', 'budget_items'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- TRIGGER FUNCTION: sync vendor average_rating + total_reviews
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_sync_vendor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_vendor_id UUID;
BEGIN
  -- Use NEW for INSERT/UPDATE, OLD for DELETE
  v_vendor_id := COALESCE(NEW.vendor_id, OLD.vendor_id);

  UPDATE vendors
  SET
    average_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::NUMERIC, 2)
         FROM vendor_reviews
        WHERE vendor_id = v_vendor_id AND is_published = true),
      0
    ),
    total_reviews = (
      SELECT COUNT(*)
        FROM vendor_reviews
       WHERE vendor_id = v_vendor_id AND is_published = true
    )
  WHERE id = v_vendor_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_vendor_rating
AFTER INSERT OR UPDATE OR DELETE ON vendor_reviews
FOR EACH ROW EXECUTE FUNCTION fn_sync_vendor_rating();

-- =============================================================================
-- TRIGGER FUNCTION: sync events.confirmed_guests on guest RSVP change
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_sync_confirmed_guests()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);

  UPDATE events
  SET confirmed_guests = (
    SELECT COUNT(*)
      FROM guests
     WHERE event_id = v_event_id AND rsvp_status = 'confirmed'
  )
  WHERE id = v_event_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_confirmed_guests
AFTER INSERT OR UPDATE OF rsvp_status OR DELETE ON guests
FOR EACH ROW EXECUTE FUNCTION fn_sync_confirmed_guests();

-- =============================================================================
-- TRIGGER FUNCTION: sync events.spent_budget on budget_item change
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_sync_spent_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);

  UPDATE events
  SET spent_budget = (
    SELECT COALESCE(SUM(COALESCE(actual_amount, estimated_amount)), 0)
      FROM budget_items
     WHERE event_id = v_event_id
  )
  WHERE id = v_event_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_spent_budget
AFTER INSERT OR UPDATE OR DELETE ON budget_items
FOR EACH ROW EXECUTE FUNCTION fn_sync_spent_budget();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
-- audit_logs: append-only, no public access
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is current user a super_admin? ──────────────────────────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
     WHERE id = auth.uid()::uuid AND role = 'super_admin' AND deleted_at IS NULL
  );
$$;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE POLICY "users: own or admin"
  ON users FOR SELECT
  USING (id = auth.uid()::uuid OR is_super_admin());

CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (id = auth.uid()::uuid);

CREATE POLICY "users: admin delete (soft)"
  ON users FOR UPDATE
  USING (is_super_admin());

-- ─── USER_SESSIONS ────────────────────────────────────────────────────────────
CREATE POLICY "sessions: own"
  ON user_sessions FOR ALL
  USING (user_id = auth.uid()::uuid);

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "events: host full access"
  ON events FOR ALL
  USING (host_id = auth.uid()::uuid);

CREATE POLICY "events: public published read"
  ON events FOR SELECT
  USING (status = 'published' AND is_private = false AND deleted_at IS NULL);

CREATE POLICY "events: admin full"
  ON events FOR ALL
  USING (is_super_admin());

-- ─── EVENT_TASKS ──────────────────────────────────────────────────────────────
CREATE POLICY "tasks: host of event"
  ON event_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
       WHERE events.id = event_tasks.event_id
         AND events.host_id = auth.uid()::uuid
    )
  );

-- ─── GUESTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "guests: host of event manages"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
       WHERE events.id = guests.event_id
         AND events.host_id = auth.uid()::uuid
    )
  );

CREATE POLICY "guests: own record read"
  ON guests FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- ─── VENDORS ─────────────────────────────────────────────────────────────────
CREATE POLICY "vendors: owner full"
  ON vendors FOR ALL
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "vendors: public read verified active"
  ON vendors FOR SELECT
  USING (
    is_active = true
    AND is_verified = 'verified'
    AND deleted_at IS NULL
  );

CREATE POLICY "vendors: admin full"
  ON vendors FOR ALL
  USING (is_super_admin());

-- ─── VENDOR_REVIEWS ──────────────────────────────────────────────────────────
CREATE POLICY "reviews: reviewer manages own"
  ON vendor_reviews FOR ALL
  USING (reviewer_id = auth.uid()::uuid);

CREATE POLICY "reviews: public read published"
  ON vendor_reviews FOR SELECT
  USING (is_published = true);

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────
CREATE POLICY "bookings: host reads own"
  ON bookings FOR SELECT
  USING (host_id = auth.uid()::uuid);

CREATE POLICY "bookings: host creates"
  ON bookings FOR INSERT
  WITH CHECK (host_id = auth.uid()::uuid);

CREATE POLICY "bookings: host updates own"
  ON bookings FOR UPDATE
  USING (host_id = auth.uid()::uuid);

CREATE POLICY "bookings: vendor reads their bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
       WHERE vendors.id = bookings.vendor_id
         AND vendors.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "bookings: vendor updates status"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
       WHERE vendors.id = bookings.vendor_id
         AND vendors.user_id = auth.uid()::uuid
    )
  );

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE POLICY "payments: payer reads own"
  ON payments FOR SELECT
  USING (payer_id = auth.uid()::uuid);

CREATE POLICY "payments: payee reads own"
  ON payments FOR SELECT
  USING (payee_id = auth.uid()::uuid);

-- ─── BUDGET_ITEMS ────────────────────────────────────────────────────────────
CREATE POLICY "budget: host of event"
  ON budget_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
       WHERE events.id = budget_items.event_id
         AND events.host_id = auth.uid()::uuid
    )
  );

-- ─── EVENT_MEMORIES ──────────────────────────────────────────────────────────
CREATE POLICY "memories: host of event manages"
  ON event_memories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
       WHERE events.id = event_memories.event_id
         AND events.host_id = auth.uid()::uuid
    )
  );

CREATE POLICY "memories: guest of event views"
  ON event_memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guests
       WHERE guests.event_id = event_memories.event_id
         AND guests.user_id  = auth.uid()::uuid
    )
  );

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE POLICY "notifications: own"
  ON notifications FOR ALL
  USING (user_id = auth.uid()::uuid);

-- ─── AI_CHAT_HISTORY ─────────────────────────────────────────────────────────
CREATE POLICY "ai_chat: own"
  ON ai_chat_history FOR ALL
  USING (user_id = auth.uid()::uuid);

-- ─── AUDIT_LOGS: admin read-only ─────────────────────────────────────────────
CREATE POLICY "audit: admin read"
  ON audit_logs FOR SELECT
  USING (is_super_admin());

-- =============================================================================
-- VIEWS (convenience, not materialized)
-- =============================================================================

-- Active events with host info
CREATE OR REPLACE VIEW v_active_events AS
SELECT
  e.*,
  u.full_name   AS host_name,
  u.avatar_url  AS host_avatar,
  u.phone       AS host_phone
FROM events e
JOIN users  u ON u.id = e.host_id
WHERE e.deleted_at IS NULL
  AND e.status NOT IN ('cancelled', 'completed');

-- Vendor leaderboard
CREATE OR REPLACE VIEW v_vendor_leaderboard AS
SELECT
  v.id, v.business_name, v.slug, v.category, v.city,
  v.average_rating, v.total_reviews, v.price_starting_from,
  v.cover_image_url, v.is_featured,
  u.full_name AS owner_name
FROM vendors v
JOIN users   u ON u.id = v.user_id
WHERE v.deleted_at IS NULL
  AND v.is_active = true
  AND v.is_verified = 'verified'
ORDER BY v.is_featured DESC, v.average_rating DESC, v.total_reviews DESC;

-- Event budget summary
CREATE OR REPLACE VIEW v_event_budget_summary AS
SELECT
  event_id,
  SUM(estimated_amount)                          AS total_estimated,
  SUM(COALESCE(actual_amount, estimated_amount)) AS total_actual,
  SUM(CASE WHEN is_paid THEN COALESCE(actual_amount, 0) ELSE 0 END) AS total_paid,
  COUNT(*)                                       AS item_count,
  COUNT(*) FILTER (WHERE is_paid)                AS paid_count
FROM budget_items
GROUP BY event_id;

-- Guest RSVP summary
CREATE OR REPLACE VIEW v_guest_rsvp_summary AS
SELECT
  event_id,
  COUNT(*)                                        AS total_invited,
  COUNT(*) FILTER (WHERE rsvp_status = 'confirmed')  AS confirmed,
  COUNT(*) FILTER (WHERE rsvp_status = 'declined')   AS declined,
  COUNT(*) FILTER (WHERE rsvp_status = 'maybe')      AS maybe,
  COUNT(*) FILTER (WHERE rsvp_status = 'pending')    AS pending,
  COUNT(*) FILTER (WHERE check_in_at IS NOT NULL)    AS checked_in
FROM guests
GROUP BY event_id;
