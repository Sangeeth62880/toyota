// ============================================
// Toyota Incentive Portal — Application Constants
// ============================================

import type { IncentiveSlab } from "@/lib/types";

/** Application display name used in page titles, headers, and metadata */
export const APP_NAME = "Toyota Incentive Portal" as const;

/**
 * Enumeration of application roles.
 *
 * Used for route guards, conditional rendering, and Supabase RLS policies.
 * Only two roles exist: `admin` manages the system, `officer` records sales.
 */
export const ROLES = {
  /** Full access: manage car models, view all officers, configure slabs */
  ADMIN: "admin",
  /** Scoped access: record own sales, view own incentive dashboard */
  OFFICER: "officer",
} as const;

/**
 * Type representing valid role values derived from the ROLES constant.
 */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Default incentive slab seed data.
 *
 * These slabs define the payout tiers for sales officers:
 * - Tier 1: 1–3 units sold  → ₹1,000 per unit
 * - Tier 2: 4–7 units sold  → ₹2,000 per unit
 * - Tier 3: 8+  units sold  → ₹3,500 per unit
 *
 * The highest slab is open-ended (`max_units: null`).
 * Used to seed the `incentive_slabs` table on first setup.
 */
export const DEFAULT_SLABS: Omit<IncentiveSlab, "id" | "updated_at">[] = [
  {
    min_units: 1,
    max_units: 3,
    incentive_per_unit: 1000,
  },
  {
    min_units: 4,
    max_units: 7,
    incentive_per_unit: 2000,
  },
  {
    min_units: 8,
    max_units: null,
    incentive_per_unit: 3500,
  },
];

/**
 * Route path constants to avoid hardcoded strings throughout the app.
 */
export const ROUTES = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  OFFICER_DASHBOARD: "/officer/dashboard",
} as const;
