-- ============================================================================
-- Toyota Incentive Portal — Database Schema
-- ============================================================================
--
-- This file creates the complete database schema for the Toyota Incentive
-- Calculator application on Supabase (PostgreSQL 15+).
--
-- Tables:
--   1. car_models        — Toyota vehicle catalog
--   2. incentive_slabs   — Tiered payout rules based on units sold
--   3. user_roles        — Maps auth.users to application roles (admin/officer)
--   4. sales_entries     — Monthly per-model sales recorded by officers
--
-- Also creates:
--   - get_user_role()        — Helper to look up a user's role
--   - update_updated_at()    — Trigger function to auto-set updated_at
--   - Row Level Security     — Fine-grained access control per table
--   - Indexes                — Optimized for common query patterns
--
-- HOW TO RUN:
--   1. Open the Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click "Run"
--   — OR —
--   1. Install Supabase CLI: npm i -g supabase
--   2. Run: supabase db reset   (applies migrations + seed)
--   3. Or:  psql $DATABASE_URL -f supabase/schema.sql
--
-- IMPORTANT: Run this file BEFORE seed.sql.
-- ============================================================================


-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
-- pgcrypto provides gen_random_uuid(); enabled by default on Supabase but
-- included here for self-hosted environments.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. HELPER FUNCTION: get_user_role(user_id)
-- ============================================================================
-- Returns the role string ('admin' | 'officer') for a given user.
-- Returns NULL if the user has no role assigned.
-- Used inside RLS policies to avoid repeating subqueries.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(lookup_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.user_roles
    WHERE user_id = lookup_user_id
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_role IS
  'Returns the application role (admin/officer) for a given auth user ID. '
  'Used by RLS policies for authorization checks.';


-- ============================================================================
-- 2. TRIGGER FUNCTION: update_updated_at()
-- ============================================================================
-- Automatically sets updated_at = now() on every UPDATE.
-- Attach this trigger to any table with an updated_at column.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at IS
  'Trigger function that auto-updates the updated_at column to now() on row UPDATE.';


-- ============================================================================
-- 3. TABLE: car_models
-- ============================================================================
-- Stores the Toyota vehicle catalog. Only active models are shown to officers
-- when recording sales. Admins manage this table via the dashboard.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.car_models (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL CONSTRAINT car_models_name_non_empty CHECK (char_length(trim(name)) > 0),
  variant    TEXT,
  image_url  TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.car_models              IS 'Toyota vehicle catalog with model names, variants, and images.';
COMMENT ON COLUMN public.car_models.name          IS 'Display name (e.g. "Fortuner", "Camry"). Must be non-empty.';
COMMENT ON COLUMN public.car_models.variant       IS 'Trim level or variant (e.g. "2.8L 4x4 AT", "G CVT"). Nullable.';
COMMENT ON COLUMN public.car_models.image_url     IS 'Public URL to the vehicle image. Nullable.';
COMMENT ON COLUMN public.car_models.is_active     IS 'If false, the model is hidden from officer sales entry forms.';

-- Trigger: auto-update updated_at
CREATE TRIGGER car_models_updated_at
  BEFORE UPDATE ON public.car_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 4. TABLE: incentive_slabs
-- ============================================================================
-- Defines tiered incentive payouts based on total units sold per month.
-- Slabs are contiguous: e.g. 1–3 → ₹1000, 4–7 → ₹2000, 8+ → ₹3500.
-- The highest tier has max_units = NULL (open-ended).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.incentive_slabs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  min_units         INTEGER     NOT NULL CONSTRAINT incentive_slabs_min_positive CHECK (min_units >= 1),
  max_units         INTEGER              CONSTRAINT incentive_slabs_max_valid   CHECK (max_units IS NULL OR max_units > min_units),
  incentive_per_unit INTEGER    NOT NULL CONSTRAINT incentive_slabs_rate_positive CHECK (incentive_per_unit > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.incentive_slabs                   IS 'Tiered incentive payout rules. Each slab defines a per-unit rate for a range of total units sold.';
COMMENT ON COLUMN public.incentive_slabs.min_units         IS 'Minimum units sold (inclusive) to qualify for this slab. Must be >= 1.';
COMMENT ON COLUMN public.incentive_slabs.max_units         IS 'Maximum units sold (inclusive). NULL means open-ended (e.g. "8 and above").';
COMMENT ON COLUMN public.incentive_slabs.incentive_per_unit IS 'Payout amount in INR per unit sold within this slab.';

-- Trigger: auto-update updated_at
CREATE TRIGGER incentive_slabs_updated_at
  BEFORE UPDATE ON public.incentive_slabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 5. TABLE: user_roles
-- ============================================================================
-- Maps Supabase auth users to application roles. Each user has exactly one role.
-- This table is the source of truth for authorization decisions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CONSTRAINT user_roles_valid_role CHECK (role IN ('admin', 'officer')),
  full_name  TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.user_roles           IS 'Maps each auth user to an application role (admin or officer).';
COMMENT ON COLUMN public.user_roles.role      IS 'Application role: "admin" for full access, "officer" for sales entry.';
COMMENT ON COLUMN public.user_roles.full_name IS 'Display name for the user. Populated on first sign-in or by admin.';


-- ============================================================================
-- 6. TABLE: sales_entries
-- ============================================================================
-- Records monthly sales per car model per officer.
-- One row per (officer, car_model, month) combination.
-- The month column stores the first day of the month (e.g. 2025-06-01).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_model_id  UUID        NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  month         DATE        NOT NULL,
  units_sold    INTEGER     NOT NULL DEFAULT 0 CONSTRAINT sales_entries_units_non_negative CHECK (units_sold >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One entry per officer per car model per month
  CONSTRAINT sales_entries_unique_entry UNIQUE (officer_id, car_model_id, month)
);

COMMENT ON TABLE  public.sales_entries              IS 'Monthly sales records per car model per officer.';
COMMENT ON COLUMN public.sales_entries.officer_id   IS 'The sales officer who recorded this entry. FK → auth.users.';
COMMENT ON COLUMN public.sales_entries.car_model_id IS 'The car model sold. FK → car_models.';
COMMENT ON COLUMN public.sales_entries.month        IS 'First day of the reporting month (e.g. 2025-06-01). Used for grouping.';
COMMENT ON COLUMN public.sales_entries.units_sold   IS 'Number of units sold. Must be >= 0.';

-- Trigger: auto-update updated_at
CREATE TRIGGER sales_entries_updated_at
  BEFORE UPDATE ON public.sales_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 7. INDEXES
-- ============================================================================
-- Optimized for the two most common query patterns:
--   1. "Get all sales for officer X in month Y"  → (officer_id, month)
--   2. "Get all sales for car model X"           → (car_model_id)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_entries_officer_month
  ON public.sales_entries (officer_id, month);

CREATE INDEX IF NOT EXISTS idx_sales_entries_car_model
  ON public.sales_entries (car_model_id);


-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables. Without policies, no rows are accessible.
-- ============================================================================

ALTER TABLE public.car_models      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_entries   ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- 8a. car_models policies
-- ────────────────────────────────────────────────────────────────────────────
-- Any authenticated user can read car models.
-- Only admins can create, update, or delete car models.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "car_models: authenticated users can view"
  ON public.car_models
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "car_models: admins can insert"
  ON public.car_models
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "car_models: admins can update"
  ON public.car_models
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "car_models: admins can delete"
  ON public.car_models
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');


-- ────────────────────────────────────────────────────────────────────────────
-- 8b. incentive_slabs policies
-- ────────────────────────────────────────────────────────────────────────────
-- Any authenticated user can read slabs (officers need them for dashboard).
-- Only admins can modify slab configuration.
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "incentive_slabs: authenticated users can view"
  ON public.incentive_slabs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "incentive_slabs: admins can insert"
  ON public.incentive_slabs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "incentive_slabs: admins can update"
  ON public.incentive_slabs
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "incentive_slabs: admins can delete"
  ON public.incentive_slabs
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');


-- ────────────────────────────────────────────────────────────────────────────
-- 8c. user_roles policies
-- ────────────────────────────────────────────────────────────────────────────
-- Users can always read their own role (needed for middleware routing).
-- Admins can read all roles (needed for the officer management page).
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "user_roles: users can view own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "user_roles: admins can insert"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "user_roles: admins can update"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "user_roles: admins can delete"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');


-- ────────────────────────────────────────────────────────────────────────────
-- 8d. sales_entries policies
-- ────────────────────────────────────────────────────────────────────────────
-- Officers can read, insert, and update ONLY their own sales entries.
-- Admins can read ALL sales entries (for reporting and leaderboard).
-- Neither role can delete sales entries (audit trail preservation).
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "sales_entries: officers can view own entries"
  ON public.sales_entries
  FOR SELECT
  TO authenticated
  USING (
    officer_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "sales_entries: officers can insert own entries"
  ON public.sales_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    officer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'officer'
  );

CREATE POLICY "sales_entries: officers can update own entries"
  ON public.sales_entries
  FOR UPDATE
  TO authenticated
  USING (
    officer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'officer'
  )
  WITH CHECK (
    officer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'officer'
  );


-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Next steps:
--   1. Run supabase/seed.sql to insert initial data
--   2. Create auth users via the Supabase Dashboard → Authentication
--   3. Insert corresponding user_roles rows (see seed.sql for instructions)
-- ============================================================================
