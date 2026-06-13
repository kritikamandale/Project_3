-- =============================================================================
-- EventNest — Seed Data
-- Test accounts (passwords: Test@1234 → bcrypt hash cost 12)
-- WARNING: Never run against production!
-- =============================================================================

BEGIN;

-- =============================================================================
-- TEST USERS
-- Passwords: all use "Test@1234"
-- bcrypt hash (cost 12) generated offline — replace with real bcrypt in CI
-- =============================================================================
INSERT INTO users (
  id, email, phone, full_name, role, plan,
  is_active, is_email_verified, is_phone_verified,
  password_hash, city, state, country, metadata
) VALUES
  -- Super Admin
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@eventnest.in',
    '+919000000001',
    'EventNest Admin',
    'super_admin', 'enterprise',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Mumbai', 'Maharashtra', 'India',
    '{"is_seed": true}'
  ),
  -- Host 1: Wedding planner
  (
    '00000000-0000-0000-0000-000000000002',
    'priya.sharma@example.com',
    '+919000000002',
    'Priya Sharma',
    'host', 'premium',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Jaipur', 'Rajasthan', 'India',
    '{"is_seed": true}'
  ),
  -- Host 2: Corporate event host
  (
    '00000000-0000-0000-0000-000000000003',
    'rahul.mehta@example.com',
    '+919000000003',
    'Rahul Mehta',
    'host', 'basic',
    true, true, false,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Mumbai', 'Maharashtra', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 1: Photographer
  (
    '00000000-0000-0000-0000-000000000004',
    'kapil.photos@example.com',
    '+919000000004',
    'Kapil Verma',
    'vendor', 'premium',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Delhi', 'Delhi', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 2: Caterer
  (
    '00000000-0000-0000-0000-000000000005',
    'sunita.caterers@example.com',
    '+919000000005',
    'Sunita Agarwal',
    'vendor', 'basic',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Jaipur', 'Rajasthan', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 3: Decorator
  (
    '00000000-0000-0000-0000-000000000006',
    'aakash.decor@example.com',
    '+919000000006',
    'Aakash Patel',
    'vendor', 'premium',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Ahmedabad', 'Gujarat', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 4: Mehendi Artist
  (
    '00000000-0000-0000-0000-000000000007',
    'nisha.mehendi@example.com',
    '+919000000007',
    'Nisha Kumari',
    'vendor', 'basic',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Jaipur', 'Rajasthan', 'India',
    '{"is_seed": true}'
  ),
  -- Guest user
  (
    '00000000-0000-0000-0000-000000000008',
    'ananya.guest@example.com',
    '+919000000008',
    'Ananya Singh',
    'guest', 'free',
    true, true, false,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Bengaluru', 'Karnataka', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 5: Venue
  (
    '00000000-0000-0000-0000-000000000009',
    'palace.venue@example.com',
    '+919000000009',
    'Raj Palace Venue',
    'vendor', 'enterprise',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Udaipur', 'Rajasthan', 'India',
    '{"is_seed": true}'
  ),
  -- Vendor 6: Music & DJ
  (
    '00000000-0000-0000-0000-000000000010',
    'dj.rohit@example.com',
    '+919000000010',
    'Rohit DJ Services',
    'vendor', 'basic',
    true, true, true,
    '$2b$12$LQv3c1yqBwEHFg7NZyT6eOFU.0Qk1Z3lZWQJl5b4mJ9tH8ZxVT.Zy',
    'Mumbai', 'Maharashtra', 'India',
    '{"is_seed": true}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VENDOR PROFILES
-- =============================================================================
INSERT INTO vendors (
  id, user_id, business_name, slug, category, sub_categories,
  description, tagline, city, state, service_areas, phone, whatsapp, email,
  price_starting_from, price_per_unit, price_range_max, currency,
  advance_required_percent, event_types_served, languages_spoken,
  years_experience, total_events_done, average_rating, total_reviews,
  is_verified, is_active, is_featured, response_time_hours,
  packages, metadata
) VALUES
  -- Photographer
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Kapil Verma Photography',
    'kapil-verma-photography',
    'photography',
    ARRAY['candid','traditional','pre-wedding','drone'],
    'Award-winning wedding & event photographer based in Delhi NCR. Specializing in candid moments, drone coverage, and cinematic highlights. 500+ weddings captured across India.',
    'Capturing your forever moments',
    'Delhi', 'Delhi',
    ARRAY['Delhi','Gurgaon','Noida','Faridabad','Jaipur'],
    '+919000000004', '+919000000004', 'kapil.photos@example.com',
    35000, 'per day', 250000, 'INR', 30,
    ARRAY['wedding','engagement','birthday','corporate','anniversary'],
    ARRAY['Hindi','English','Punjabi'],
    8, 520, 4.8, 0,
    'verified', true, true, 6,
    '[
      {"name": "Silver Package", "price": 35000, "description": "8 hours, 500 edited photos, 1 photographer"},
      {"name": "Gold Package", "price": 65000, "description": "Full day, 1000+ photos, 2 photographers, drone"},
      {"name": "Platinum Package", "price": 120000, "description": "2 days, video highlights, album, drone"}
    ]',
    '{"is_seed": true}'
  ),
  -- Caterer
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    'Sunita Premium Caterers',
    'sunita-premium-caterers',
    'catering',
    ARRAY['rajasthani','north-indian','continental','live-counters'],
    'Authentic Rajasthani and North Indian cuisine with 15+ years of experience. Serving 50 to 5000 guests. Hygienic kitchen, experienced chefs, customized menus for every occasion.',
    'Taste the tradition, feel the warmth',
    'Jaipur', 'Rajasthan',
    ARRAY['Jaipur','Ajmer','Kota','Jodhpur','Delhi'],
    '+919000000005', '+919000000005', 'sunita.caterers@example.com',
    400, 'per plate', 1200, 'INR', 25,
    ARRAY['wedding','birthday','corporate','puja','anniversary','social'],
    ARRAY['Hindi','English','Rajasthani'],
    15, 1200, 4.6, 0,
    'verified', true, true, 12,
    '[
      {"name": "Basic Thali", "price": 400, "description": "10 items veg thali, serves 50+ guests"},
      {"name": "Premium Thali", "price": 700, "description": "18 items veg + non-veg, live counters"},
      {"name": "Royal Banquet", "price": 1200, "description": "Full Rajasthani experience, 25+ items, live music"}
    ]',
    '{"is_seed": true}'
  ),
  -- Decorator
  (
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000006',
    'Aakash Dream Decorators',
    'aakash-dream-decorators',
    'decoration',
    ARRAY['floral','balloon','theme','mandap','stage'],
    'Transforming venues into dreamscapes. Specializing in Pichwai-inspired floral setups, grand mandap decorations, and themed events. Serving Gujarat and beyond.',
    'Where every event becomes a masterpiece',
    'Ahmedabad', 'Gujarat',
    ARRAY['Ahmedabad','Surat','Vadodara','Mumbai','Jaipur'],
    '+919000000006', '+919000000006', 'aakash.decor@example.com',
    25000, 'per event', 500000, 'INR', 40,
    ARRAY['wedding','engagement','birthday','anniversary','puja','housewarming'],
    ARRAY['Hindi','English','Gujarati'],
    10, 800, 4.9, 0,
    'verified', true, false, 8,
    '[
      {"name": "Simple Elegance", "price": 25000, "description": "Basic floral decor for 50 guests"},
      {"name": "Grand Celebration", "price": 80000, "description": "Full venue decor, mandap, stage"},
      {"name": "Royal Wedding", "price": 250000, "description": "Luxury Pichwai-themed complete setup"}
    ]',
    '{"is_seed": true}'
  ),
  -- Mehendi Artist
  (
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000007',
    'Nisha Mehendi Art',
    'nisha-mehendi-art',
    'mehendi',
    ARRAY['bridal','arabic','rajasthani','indo-arabic'],
    'Professional Mehendi artist with intricate designs for weddings and festivals. Specializing in Rajasthani bridal and Indo-Arabic patterns. 5 artists team available.',
    'Art that adorns, moments that last',
    'Jaipur', 'Rajasthan',
    ARRAY['Jaipur','Delhi','Agra','Udaipur'],
    '+919000000007', '+919000000007', 'nisha.mehendi@example.com',
    2500, 'per sitting', 15000, 'INR', 20,
    ARRAY['wedding','engagement','anniversary','festive'],
    ARRAY['Hindi','English','Rajasthani'],
    7, 350, 4.7, 0,
    'verified', true, false, 4,
    '[
      {"name": "Bridal Mehendi", "price": 5000, "description": "Both hands and feet, 3-4 hours"},
      {"name": "Party Mehendi", "price": 2500, "description": "Simple pattern, 1-2 hours"},
      {"name": "Full Team Package", "price": 15000, "description": "Team of 5 for 50+ guests"}
    ]',
    '{"is_seed": true}'
  ),
  -- Venue
  (
    'a0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000009',
    'Raj Palace Banquet Hall',
    'raj-palace-banquet-udaipur',
    'venue',
    ARRAY['banquet-hall','lawn','rooftop','heritage'],
    'Heritage palace venue in the City of Lakes, Udaipur. 3 acres sprawling property with lake view, indoor & outdoor spaces, parking for 200+ vehicles. Perfect for royal weddings.',
    'Celebrate royally in the city of lakes',
    'Udaipur', 'Rajasthan',
    ARRAY['Udaipur'],
    '+919000000009', '+919000000009', 'palace.venue@example.com',
    150000, 'per day', 800000, 'INR', 50,
    ARRAY['wedding','corporate','anniversary','social','engagement'],
    ARRAY['Hindi','English','Rajasthani','Gujarati'],
    20, 2000, 4.9, 0,
    'verified', true, true, 2,
    '[
      {"name": "Lawn Package", "price": 150000, "description": "Outdoor lawn for 300 guests, basic furniture"},
      {"name": "Palace Package", "price": 350000, "description": "Full venue, AC halls, parking, basic decor"},
      {"name": "Royal Package", "price": 800000, "description": "Full palace for 2 days, all amenities"}
    ]',
    '{"is_seed": true}'
  ),
  -- DJ / Music
  (
    'a0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000010',
    'DJ Rohit Entertainment',
    'dj-rohit-entertainment-mumbai',
    'music',
    ARRAY['dj','live-band','sound-system','led-setup'],
    'Mumbai''s top DJ and entertainment service. State-of-the-art sound and LED setup. Specializing in Bollywood, EDM, Punjabi beats. Available across Maharashtra.',
    'Drop the beat, raise the energy!',
    'Mumbai', 'Maharashtra',
    ARRAY['Mumbai','Pune','Nashik','Thane','Navi Mumbai'],
    '+919000000010', '+919000000010', 'dj.rohit@example.com',
    15000, 'per event', 80000, 'INR', 30,
    ARRAY['wedding','birthday','corporate','anniversary','social','farewell'],
    ARRAY['Hindi','English','Marathi'],
    6, 400, 4.5, 0,
    'verified', true, false, 6,
    '[
      {"name": "Basic DJ", "price": 15000, "description": "DJ + sound system, 4 hours"},
      {"name": "Premium DJ", "price": 35000, "description": "DJ + LED wall + fog machine, 6 hours"},
      {"name": "Full Entertainment", "price": 80000, "description": "DJ + live singer + LED + lighting, full night"}
    ]',
    '{"is_seed": true}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EVENTS
-- =============================================================================
INSERT INTO events (
  id, slug, host_id, title, description, event_type, status,
  event_date, event_time, end_date, end_time,
  venue_name, venue_address, venue_city, venue_state, venue_pincode,
  expected_guests, total_budget, cover_image_url,
  theme, dress_code, special_instructions, is_private,
  checklist, metadata
) VALUES
  -- Wedding event (Priya's wedding)
  (
    'e0000000-0000-0000-0000-000000000001',
    'priya-sharma-wedding-2026',
    '00000000-0000-0000-0000-000000000002',
    'Priya & Arjun — The Royal Wedding',
    'A grand Rajasthani-themed wedding celebration at Raj Palace, Udaipur. Join us for 3 days of festivities, food, and unforgettable memories.',
    'wedding', 'published',
    '2026-12-15', '11:00', '2026-12-17', '14:00',
    'Raj Palace Banquet Hall',
    'Near Lake Pichola, City Palace Road', 'Udaipur', 'Rajasthan', '313001',
    350, 2500000,
    'https://res.cloudinary.com/eventnest/image/upload/v1/seed/wedding-cover.jpg',
    'Pichwai Royal', 'Traditional Rajasthani Attire',
    'Please arrive 30 minutes early. Valet parking available. Complimentary accommodation for outstation guests.',
    false,
    '[
      {"id":"t1","title":"Book venue","done":true,"priority":"high"},
      {"id":"t2","title":"Finalize catering menu","done":true,"priority":"high"},
      {"id":"t3","title":"Send invitations","done":true,"priority":"high"},
      {"id":"t4","title":"Book photographer","done":true,"priority":"high"},
      {"id":"t5","title":"Book mehendi artist","done":false,"priority":"medium"},
      {"id":"t6","title":"Arrange transport for guests","done":false,"priority":"medium"},
      {"id":"t7","title":"Bride & groom entry choreography","done":false,"priority":"low"},
      {"id":"t8","title":"Finalise wedding cake","done":false,"priority":"medium"}
    ]',
    '{"is_seed": true}'
  ),
  -- Birthday party (Rahul's son)
  (
    'e0000000-0000-0000-0000-000000000002',
    'aarav-birthday-2026',
    '00000000-0000-0000-0000-000000000003',
    'Aarav''s 5th Birthday Bash!',
    'Come celebrate little Aarav''s 5th birthday with a superhero theme party! Fun, food, and lots of games for the kids.',
    'birthday', 'draft',
    '2026-08-20', '16:00', NULL, '20:00',
    'Home Venue',
    'Bandra West', 'Mumbai', 'Maharashtra', '400050',
    60, 75000, NULL,
    'Superhero', 'Casual — wear your favourite superhero colour',
    'Strictly no outside food. Allergen info: nut-free zone.',
    true,
    '[
      {"id":"t1","title":"Book birthday cake","done":false,"priority":"high"},
      {"id":"t2","title":"Order superhero decorations","done":false,"priority":"high"},
      {"id":"t3","title":"Hire DJ / entertainer","done":false,"priority":"medium"},
      {"id":"t4","title":"Send invites to school friends","done":false,"priority":"high"}
    ]',
    '{"is_seed": true}'
  ),
  -- Corporate event (Rahul's company)
  (
    'e0000000-0000-0000-0000-000000000003',
    'techcorp-annual-meet-2026',
    '00000000-0000-0000-0000-000000000003',
    'TechCorp Annual Day 2026',
    'Annual Day celebration for TechCorp Pvt Ltd. Awards ceremony, performances, and a grand dinner for 200 employees.',
    'corporate', 'published',
    '2026-09-10', '18:00', NULL, '23:00',
    'The Lalit Mumbai',
    'Sahar Airport Road, Andheri East', 'Mumbai', 'Maharashtra', '400059',
    200, 500000, NULL,
    'Corporate Gala', 'Formal / Business Attire',
    'RSVP mandatory by Sep 1. Parking validated.',
    false,
    '[]',
    '{"is_seed": true}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- GUESTS (for the wedding event)
-- =============================================================================
INSERT INTO guests (
  id, event_id, user_id, full_name, email, phone,
  rsvp_status, plus_one, meal_preference, side, relation,
  is_vip, consent_given, metadata
) VALUES
  (
    'g0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000008',
    'Ananya Singh', 'ananya.guest@example.com', '+919000000008',
    'confirmed', false, 'veg', 'bride', 'Best Friend',
    true, true, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Vikram Nair', 'vikram.nair@example.com', '+919100000001',
    'confirmed', true, 'non_veg', 'groom', 'College Friend',
    false, true, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Kavita Sharma', 'kavita.sharma@example.com', '+919100000002',
    'pending', false, 'veg', 'bride', 'Cousin',
    false, false, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Suresh Gupta', NULL, '+919100000003',
    'declined', false, 'veg', 'both', 'Uncle',
    false, true, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Deepika Malhotra', 'deepika.m@example.com', '+919100000004',
    'maybe', true, 'veg', 'bride', 'Office Colleague',
    false, true, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000006',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Arjun Kapoor', 'arjun.k@example.com', '+919100000005',
    'confirmed', false, 'non_veg', 'groom', 'Brother',
    true, true, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000007',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Sita Devi', NULL, '+919100000006',
    'confirmed', false, 'jain', 'bride', 'Grandmother',
    true, false, '{"is_seed": true}'
  ),
  (
    'g0000000-0000-0000-0000-000000000008',
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'Raj Sharma', 'raj.sharma@example.com', '+919100000007',
    'pending', true, 'veg', 'both', 'Family Friend',
    false, true, '{"is_seed": true}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BOOKINGS (for the wedding event)
-- =============================================================================
INSERT INTO bookings (
  id, event_id, vendor_id, host_id, status,
  service_date, service_description,
  quoted_amount, final_amount, advance_amount, advance_paid,
  notes, metadata
) VALUES
  -- Photography booking
  (
    'b0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'confirmed',
    '2026-12-15',
    'Gold package — 2 photographers, drone, full 3 days coverage',
    120000, 120000, 36000, true,
    'Delivery of edited photos within 45 days. 2 albums included.',
    '{"is_seed": true}'
  ),
  -- Catering booking
  (
    'b0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'confirmed',
    '2026-12-15',
    'Royal Banquet — 350 guests, 3 days, veg + jain + non-veg options',
    875000, 875000, 218750, true,
    'Live chaat counter, paan counter, dry fruit arrangements included.',
    '{"is_seed": true}'
  ),
  -- Decoration booking
  (
    'b0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'in_progress',
    '2026-12-14',
    'Pichwai Royal theme — full venue including sangeet, mehendi, and wedding stages',
    380000, 380000, 150000, true,
    'Vendor to visit venue on Dec 10 for final layout check.',
    '{"is_seed": true}'
  ),
  -- Mehendi booking
  (
    'b0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'quoted',
    '2026-12-14',
    'Team of 5 for bridal + 30 female guests',
    18000, NULL, 0, false,
    'Bride wants full Rajasthani bridal + Indo-Arabic combination.',
    '{"is_seed": true}'
  ),
  -- Venue booking
  (
    'b0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'confirmed',
    '2026-12-14',
    'Full palace for 3 days (Dec 14-17) — Royal Package',
    750000, 750000, 375000, true,
    'Complimentary 10 rooms for 3 nights. Parking for 200 vehicles.',
    '{"is_seed": true}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BUDGET ITEMS (for the wedding event)
-- =============================================================================
INSERT INTO budget_items (
  id, event_id, category, item_name,
  estimated_amount, actual_amount, is_paid,
  vendor_id, booking_id, notes
) VALUES
  ('bi000001', 'e0000000-0000-0000-0000-000000000001', 'Venue',       'Raj Palace — 3 days',         750000, 750000, true,  'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Advance paid'),
  ('bi000002', 'e0000000-0000-0000-0000-000000000001', 'Catering',    '350 guests x 3 days',         875000, 875000, true,  'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Advance paid'),
  ('bi000003', 'e0000000-0000-0000-0000-000000000001', 'Photography', 'Full coverage 3 days',        120000, 120000, true,  'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Advance paid'),
  ('bi000004', 'e0000000-0000-0000-0000-000000000001', 'Decoration',  'Pichwai theme full venue',    380000, 380000, true,  'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Balance due on Dec 18'),
  ('bi000005', 'e0000000-0000-0000-0000-000000000001', 'Mehendi',     'Bridal + 30 guests',          18000,  NULL,   false, 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Quote received, pending confirmation'),
  ('bi000006', 'e0000000-0000-0000-0000-000000000001', 'Transport',   'Guest bus from Jaipur',        35000,  NULL,   false, NULL, NULL, 'To book AC Volvo bus for 40 guests'),
  ('bi000007', 'e0000000-0000-0000-0000-000000000001', 'Jewellery',   'Bride jewellery set',         150000, 145000, true,  NULL, NULL, 'Purchased from Tanishq Jaipur'),
  ('bi000008', 'e0000000-0000-0000-0000-000000000001', 'Invitations', 'Printed + digital invites',    12000,  11500,  true,  NULL, NULL, NULL),
  ('bi000009', 'e0000000-0000-0000-0000-000000000001', 'Cake',        '5-tier wedding cake',          18000,  NULL,   false, NULL, NULL, 'Custom Pichwai-themed cake order pending'),
  ('bi000010', 'e0000000-0000-0000-0000-000000000001', 'Gifts',       'Return gifts for 350 guests', 105000,  NULL,   false, NULL, NULL, 'Silver-plated diyas planned')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VENDOR REVIEWS
-- =============================================================================
INSERT INTO vendor_reviews (
  id, vendor_id, reviewer_id, event_id, booking_id,
  rating, title, review_text, is_verified_booking, helpful_count,
  is_published, created_at
) VALUES
  (
    'r0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    5, 'Absolutely stunning work!',
    'Kapil captured every emotion perfectly. The drone shots of Udaipur lake at sunset were magical. Highly recommend for weddings!',
    true, 12, true, NOW() - INTERVAL '30 days'
  ),
  (
    'r0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    5, 'Best Rajasthani food ever!',
    'The dal baati churma was to die for. Guests kept complimenting the food all night. Live chaat counter was a hit. Very hygienic and professional team.',
    true, 8, true, NOW() - INTERVAL '25 days'
  ),
  (
    'r0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    NULL, NULL,
    5, 'Magical transformation!',
    'Aakash and his team transformed the venue completely. The Pichwai-inspired decor with peacock motifs was breathtaking. Every guest was amazed.',
    false, 15, true, NOW() - INTERVAL '20 days'
  ),
  (
    'r0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    NULL, NULL,
    5, 'A palace fit for a king!',
    'Raj Palace is truly magnificent. The staff was incredibly courteous and the lake view made everything special. Worth every penny.',
    false, 20, true, NOW() - INTERVAL '15 days'
  ),
  (
    'r0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    NULL, NULL,
    4, 'Great photographer, slight delay in delivery',
    'Amazing candid shots and very professional. Only wish the album delivery was faster — took 60 days instead of 45.',
    false, 5, true, NOW() - INTERVAL '60 days'
  ),
  (
    'r0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000008',
    NULL, NULL,
    5, 'Nisha is an artist!',
    'The bridal mehendi was gorgeous. Nisha spent 4 hours getting every detail perfect. Friends from the wedding are still asking who did it!',
    false, 9, true, NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- NOTIFICATIONS (sample)
-- =============================================================================
INSERT INTO notifications (
  id, user_id, type, title, body, data, is_read, action_url
) VALUES
  (
    'n0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'rsvp_update',
    'New RSVP from Vikram Nair',
    'Vikram Nair has confirmed attendance for your wedding! Plus one: Yes.',
    '{"guest_id": "g0000000-0000-0000-0000-000000000002", "event_id": "e0000000-0000-0000-0000-000000000001"}',
    false,
    '/host/events/e0000000-0000-0000-0000-000000000001/guests'
  ),
  (
    'n0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'payment',
    'Payment confirmed: Photography advance',
    'Your advance payment of ₹36,000 to Kapil Verma Photography has been confirmed.',
    '{"booking_id": "b0000000-0000-0000-0000-000000000001", "amount": 36000}',
    true,
    '/host/events/e0000000-0000-0000-0000-000000000001/vendors'
  ),
  (
    'n0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'reminder',
    'Event in 7 days!',
    'Your wedding is just 7 days away. 3 tasks are still pending. Review your checklist.',
    '{"event_id": "e0000000-0000-0000-0000-000000000001", "pending_tasks": 3}',
    false,
    '/host/events/e0000000-0000-0000-0000-000000000001'
  ),
  (
    'n0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'booking',
    'New booking inquiry!',
    'Priya Sharma has confirmed a booking for your Gold Package.',
    '{"booking_id": "b0000000-0000-0000-0000-000000000001"}',
    false,
    '/vendor/bookings'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EVENT TASKS (for the wedding)
-- =============================================================================
INSERT INTO event_tasks (
  id, event_id, title, description, status, priority, due_date, sort_order
) VALUES
  ('et000001', 'e0000000-0000-0000-0000-000000000001', 'Book Mehendi artist',     'Confirm Nisha Mehendi Art booking and pay advance',         'in_progress', 'high',   '2026-11-01', 1),
  ('et000002', 'e0000000-0000-0000-0000-000000000001', 'Arrange guest transport', 'Book AC Volvo bus for 40 outstation guests from Jaipur',    'todo',        'medium',  '2026-11-15', 2),
  ('et000003', 'e0000000-0000-0000-0000-000000000001', 'Order wedding cake',      'Custom 5-tier Pichwai-themed cake — place order with baker', 'todo',       'medium',  '2026-11-20', 3),
  ('et000004', 'e0000000-0000-0000-0000-000000000001', 'Purchase return gifts',   'Silver-plated diyas for 350 guests — bulk order',           'todo',        'low',    '2026-11-30', 4),
  ('et000005', 'e0000000-0000-0000-0000-000000000001', 'Confirm room bookings',   '10 complimentary rooms for outstation family members',       'done',       'high',   '2026-10-01', 5),
  ('et000006', 'e0000000-0000-0000-0000-000000000001', 'Music & DJ for sangeet',  'Book DJ Rohit for sangeet night Dec 15',                    'todo',        'medium', '2026-11-10', 6)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Update event spent_budget to match items (trigger handles future inserts)
-- =============================================================================
UPDATE events
SET
  spent_budget     = 2481500,
  confirmed_guests = 4
WHERE id = 'e0000000-0000-0000-0000-000000000001';

-- =============================================================================
-- AUDIT LOG — seed operation recorded
-- =============================================================================
INSERT INTO audit_logs (user_id, action, resource_type, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'seed_data_loaded',
  'system',
  '{"version": "001", "tables": ["users","vendors","events","guests","bookings","budget_items","vendor_reviews","notifications","event_tasks"]}'
);

COMMIT;
