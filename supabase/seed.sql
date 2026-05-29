-- ============================================================================
-- Toyota Incentive Portal — Seed Data
-- ============================================================================
--
-- This file inserts initial reference data into the Toyota Incentive Portal.
--
-- Contents:
--   1. 6 Toyota car models (Fortuner, Innova HyCross, Camry, etc.)
--   2. 3 incentive slab tiers (₹1000 / ₹2000 / ₹3500 per unit)
--   3. 2 user_roles rows (1 admin + 1 officer) — see instructions below
--
-- HOW TO RUN:
--   1. Run supabase/schema.sql FIRST (creates tables, RLS, triggers)
--   2. Create the two auth users in the Supabase Dashboard (see Step 3 below)
--   3. Replace the placeholder UUIDs in the user_roles INSERT with real UUIDs
--   4. Paste this file into the Supabase SQL Editor and click "Run"
--   — OR —
--   psql $DATABASE_URL -f supabase/seed.sql
--
-- ============================================================================


-- ============================================================================
-- 1. CAR MODELS
-- ============================================================================
-- Six popular Toyota India models with realistic variant names.
-- image_url is left NULL — replace with actual CDN URLs in production.
-- ============================================================================

INSERT INTO public.car_models (name, variant, image_url, is_active) VALUES
  ('Fortuner',            '2.8L 4x4 AT Legender',     'https://static3.toyotabharat.com/images/showroom/fortuner/fortuner-mmc/experience-legender-car.webp', true),
  ('Innova HyCross',      'ZX(O) Hybrid 7-Seater',    'https://static3.toyotabharat.com/images/showroom/innova-hycross/hy-concept-img.webp', true),
  ('Camry',               '2.5L Hybrid V',             'https://static3.toyotabharat.com/images/showroom/new-camry/sport.webp', true),
  ('Hilux',               '2.8L 4x4 High AT',         'https://static.toyotabharat.com/images/showroom/hilux/hilux-emi-calculator-1370x965.webp', true),
  ('Urban Cruiser Taisor','S+ AMT Turbo',              'https://static3.toyotabharat.com/images/showroom/d27/introduction/D27_Make_Your_freedom_red_1200x400px.webp', true),
  ('Glanza',              'V AMT',                     'https://static3.toyotabharat.com/images/showroom/glanza/color/insta-blue.webp', true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 2. INCENTIVE SLABS
-- ============================================================================
-- Three-tier payout structure:
--
--   Tier 1:  1–3 units sold  → ₹1,000 per unit
--   Tier 2:  4–7 units sold  → ₹2,000 per unit
--   Tier 3:  8+  units sold  → ₹3,500 per unit (open-ended, max_units = NULL)
--
-- The incentive is calculated on the TOTAL units across all models in a month.
-- The active slab's rate applies to ALL units (flat rate, not marginal).
-- ============================================================================

INSERT INTO public.incentive_slabs (min_units, max_units, incentive_per_unit) VALUES
  (1,  3,    1000),   -- Tier 1: ₹1,000/unit for 1–3 units
  (4,  7,    2000),   -- Tier 2: ₹2,000/unit for 4–7 units
  (8,  NULL, 3500)    -- Tier 3: ₹3,500/unit for 8+ units (uncapped)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 3. AUTH USERS & ROLES
-- ============================================================================
--
-- ⚠️  Supabase auth.users CANNOT be seeded via SQL.
--     You must create the users manually through the Supabase Dashboard.
--
-- STEP-BY-STEP INSTRUCTIONS:
--
--   A. Create the Admin user:
--      1. Go to Supabase Dashboard → Authentication → Users
--      2. Click "Add user" → "Create new user"
--      3. Enter:
--           Email:    admin@toyota-portal.com
--           Password: Admin@1234  (change in production!)
--         ☑ Auto Confirm User
--      4. Click "Create user"
--      5. Copy the generated UUID from the user row
--      6. Replace 'REPLACE_WITH_ADMIN_UUID' below with that UUID
--
--   B. Create the Officer user:
--      1. Repeat the above with:
--           Email:    officer@toyota-portal.com
--           Password: Officer@1234  (change in production!)
--         ☑ Auto Confirm User
--      2. Copy the generated UUID
--      3. Replace 'REPLACE_WITH_OFFICER_UUID' below with that UUID
--
--   C. Run the INSERT statements below (after replacing UUIDs)
--
-- ============================================================================

-- ── Replace these placeholder UUIDs with real auth.users UUIDs ──────────────

-- INSERT INTO public.user_roles (user_id, role, full_name, email) VALUES
--   ('REPLACE_WITH_ADMIN_UUID',   'admin',   'Portal Admin', 'admin@toyota-portal.com'),
--   ('REPLACE_WITH_OFFICER_UUID', 'officer', 'Raj Kumar',    'officer@toyota-portal.com');

-- ── Example with real UUIDs (uncomment and edit): ───────────────────────────
--
-- INSERT INTO public.user_roles (user_id, role, full_name) VALUES
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin',   'Portal Admin'),
--   ('f9e8d7c6-b5a4-3210-fedc-ba0987654321', 'officer', 'Raj Kumar');


-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
-- Verify the seed data:
--
--   SELECT * FROM public.car_models;
--   SELECT * FROM public.incentive_slabs ORDER BY min_units;
--   SELECT * FROM public.user_roles;
--
-- ============================================================================
