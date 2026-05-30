import type { IncentiveSlab } from "@/lib/types";

export const APP_NAME = "Toyota Incentive Portal" as const;

export const ROLES = {
  ADMIN: "admin",
  OFFICER: "officer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

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

export const ROUTES = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  OFFICER_DASHBOARD: "/officer/dashboard",
} as const;
