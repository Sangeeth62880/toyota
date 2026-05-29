// ============================================
// Toyota Incentive Portal — Domain Type System
// ============================================

/**
 * Represents a Toyota car model available for sale.
 *
 * Stored in the `car_models` table in Supabase.
 * Only active models (`is_active = true`) are shown to officers.
 */
export interface CarModel {
  /** UUID primary key */
  id: string;
  /** Display name (e.g. "Camry", "Fortuner") */
  name: string;
  /** Variant or trim level (e.g. "G MT", "Legender 4x4") */
  variant: string;
  /** Public URL to the car model image */
  image_url: string;
  /** Whether this model is currently available for sale entry */
  is_active: boolean;
  /** ISO 8601 timestamp of record creation */
  created_at: string;
}

/**
 * Defines an incentive payout slab based on units sold.
 *
 * Slabs are contiguous ranges: e.g. 1–3 units → ₹1,000/unit.
 * The highest slab has `max_units = null` (unbounded).
 * Stored in the `incentive_slabs` table.
 */
export interface IncentiveSlab {
  /** UUID primary key */
  id: string;
  /** Minimum units sold (inclusive) to qualify for this slab */
  min_units: number;
  /** Maximum units sold (inclusive), or null for the highest open-ended slab */
  max_units: number | null;
  /** Payout per unit in this slab (INR) */
  incentive_per_unit: number;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * A single sales entry recorded by an officer for a given car model and month.
 *
 * One row per (officer, car_model, month) combination.
 * Stored in the `sales_entries` table.
 */
export interface SalesEntry {
  /** UUID primary key */
  id: string;
  /** Foreign key → auth.users.id (the sales officer) */
  officer_id: string;
  /** Foreign key → car_models.id */
  car_model_id: string;
  /** Month in YYYY-MM format (e.g. "2025-06") */
  month: string;
  /** Number of units sold for this car model in the given month */
  units_sold: number;
  /** ISO 8601 timestamp of record creation */
  created_at: string;
}

/**
 * Maps a Supabase auth user to an application role.
 *
 * Stored in the `user_roles` table.
 * Each user has exactly one role: admin or officer.
 */
export interface UserRole {
  /** Foreign key → auth.users.id */
  user_id: string;
  /** Application role determining dashboard access and permissions */
  role: "admin" | "officer";
}

/**
 * Application-level user profile combining auth data with role.
 *
 * Hydrated from Supabase auth session + the `user_roles` table.
 * Used throughout the app for display and authorization checks.
 */
export interface User {
  /** Supabase auth user UUID */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  full_name: string;
  /** Application role */
  role: "admin" | "officer";
}

/**
 * Computed incentive calculation result for a sales officer in a given month.
 *
 * Returned by the incentive calculation engine — never persisted directly.
 * Contains the total payout plus contextual "next tier" motivation data.
 */
export interface IncentiveResult {
  /** Total units sold across all car models in the month */
  total_units: number;
  /** The incentive slab that applies based on total_units */
  active_slab: IncentiveSlab;
  /** Total incentive payout in INR (total_units × active_slab.incentive_per_unit) */
  payout: number;
  /** Units remaining to reach the next higher slab (0 if already at top) */
  units_to_next_tier: number;
  /** Projected bonus at the next slab (0 if already at top) */
  bonus_at_next_tier: number;
  /** Per-car-model breakdown of units sold */
  breakdown: CarSale[];
}

/**
 * Per-car-model sales summary used inside the incentive breakdown.
 *
 * Denormalized view joining sales_entries with car_models for display.
 */
export interface CarSale {
  /** Foreign key → car_models.id */
  car_model_id: string;
  /** Display name of the car model */
  car_name: string;
  /** Public URL to the car model image */
  image_url: string;
  /** Units sold for this specific model in the period */
  units_sold: number;
}
