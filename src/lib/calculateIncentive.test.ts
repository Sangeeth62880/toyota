// ============================================================================
// Toyota Incentive Portal — Incentive Calculation Tests
// ============================================================================
//
// Comprehensive test suite for the pure incentive calculation engine.
// Covers happy paths, edge cases, boundary conditions, and helper functions.
//
// Run: npx vitest run src/lib/calculateIncentive.test.ts
// ============================================================================

import { describe, expect, it } from "vitest";

import type { CarSale, IncentiveSlab } from "@/lib/types";

import {
  calculateIncentive,
  getProgressToNextTier,
  getSlabForUnits,
} from "./calculateIncentive";

// ─── Test Fixtures ──────────────────────────────────────────────────────────

/** Standard 3-tier slab configuration matching DEFAULT_SLABS in constants.ts */
const STANDARD_SLABS: IncentiveSlab[] = [
  {
    id: "slab-1",
    min_units: 1,
    max_units: 3,
    incentive_per_unit: 1000,
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "slab-2",
    min_units: 4,
    max_units: 7,
    incentive_per_unit: 2000,
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "slab-3",
    min_units: 8,
    max_units: null,
    incentive_per_unit: 3500,
    updated_at: "2025-01-01T00:00:00Z",
  },
];

/** Same slabs but in reverse order — tests that sorting works */
const REVERSE_SLABS: IncentiveSlab[] = [...STANDARD_SLABS].reverse();

/** Single open-ended slab (no tiers, just a flat rate) */
const SINGLE_SLAB: IncentiveSlab[] = [
  {
    id: "slab-only",
    min_units: 1,
    max_units: null,
    incentive_per_unit: 1500,
    updated_at: "2025-01-01T00:00:00Z",
  },
];

/** Helper to create a CarSale fixture */
function makeSale(
  car_model_id: string,
  car_name: string,
  units_sold: number
): CarSale {
  return { car_model_id, car_name, image_url: "", units_sold };
}

// ─── getSlabForUnits() ──────────────────────────────────────────────────────

describe("getSlabForUnits", () => {
  it("returns null when units is 0", () => {
    expect(getSlabForUnits(0, STANDARD_SLABS)).toBeNull();
  });

  it("returns null when units is negative", () => {
    expect(getSlabForUnits(-5, STANDARD_SLABS)).toBeNull();
  });

  it("returns null when slabs array is empty", () => {
    expect(getSlabForUnits(5, [])).toBeNull();
  });

  it("returns the first slab for 1 unit (lower boundary)", () => {
    const slab = getSlabForUnits(1, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-1");
    expect(slab?.incentive_per_unit).toBe(1000);
  });

  it("returns the first slab for 3 units (upper boundary of tier 1)", () => {
    const slab = getSlabForUnits(3, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-1");
  });

  it("picks the higher slab when exactly on a slab boundary (4 units)", () => {
    const slab = getSlabForUnits(4, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-2");
    expect(slab?.incentive_per_unit).toBe(2000);
  });

  it("returns the mid-tier slab for 5 units", () => {
    const slab = getSlabForUnits(5, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-2");
  });

  it("picks the top slab when exactly on boundary (8 units)", () => {
    const slab = getSlabForUnits(8, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-3");
    expect(slab?.incentive_per_unit).toBe(3500);
  });

  it("returns the top slab for very high unit counts (100 units)", () => {
    const slab = getSlabForUnits(100, STANDARD_SLABS);
    expect(slab?.id).toBe("slab-3");
  });

  it("works correctly with unsorted (reverse-order) slabs", () => {
    const slab = getSlabForUnits(5, REVERSE_SLABS);
    expect(slab?.id).toBe("slab-2");
  });

  it("returns the single slab for any positive unit count", () => {
    const slab = getSlabForUnits(1, SINGLE_SLAB);
    expect(slab?.id).toBe("slab-only");
  });
});

// ─── getProgressToNextTier() ────────────────────────────────────────────────

describe("getProgressToNextTier", () => {
  it("returns 0 when units is 0 (no qualifying slab)", () => {
    expect(getProgressToNextTier(0, STANDARD_SLABS)).toBe(0);
  });

  it("returns 0 at the start of tier 1 (1 unit, tier spans 1-3)", () => {
    // 1 unit, tier 1 is min=1 max=3, span=3, unitsInto=0 → 0%
    expect(getProgressToNextTier(1, STANDARD_SLABS)).toBe(0);
  });

  it("returns ~33% one unit into a 3-unit tier", () => {
    // 2 units, tier 1 span=3, unitsInto=1 → 33.33%
    expect(getProgressToNextTier(2, STANDARD_SLABS)).toBeCloseTo(33.33, 1);
  });

  it("returns ~66% two units into a 3-unit tier", () => {
    // 3 units, tier 1 span=3, unitsInto=2 → 66.67%
    expect(getProgressToNextTier(3, STANDARD_SLABS)).toBeCloseTo(66.67, 1);
  });

  it("returns 0% at the start of tier 2 (boundary, 4 units)", () => {
    // 4 units picks tier 2 (min=4 max=7), span=4, unitsInto=0 → 0%
    expect(getProgressToNextTier(4, STANDARD_SLABS)).toBe(0);
  });

  it("returns 25% one unit into tier 2 (5 units)", () => {
    // 5 units, tier 2 span=4, unitsInto=1 → 25%
    expect(getProgressToNextTier(5, STANDARD_SLABS)).toBe(25);
  });

  it("returns 100 when in the top tier (open-ended, 10 units)", () => {
    expect(getProgressToNextTier(10, STANDARD_SLABS)).toBe(100);
  });

  it("returns 100 when there is only a single open-ended slab", () => {
    expect(getProgressToNextTier(5, SINGLE_SLAB)).toBe(100);
  });

  it("returns 0 when slabs array is empty", () => {
    expect(getProgressToNextTier(5, [])).toBe(0);
  });

  it("works correctly with unsorted slabs", () => {
    expect(getProgressToNextTier(5, REVERSE_SLABS)).toBe(25);
  });
});

// ─── calculateIncentive() ───────────────────────────────────────────────────

describe("calculateIncentive", () => {
  // ── Happy path ──────────────────────────────────────────────────────────

  it("calculates correct payout for tier 1 (2 units total)", () => {
    const sales = [
      makeSale("a", "Fortuner", 1),
      makeSale("b", "Camry", 1),
    ];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(2);
    expect(result.active_slab.id).toBe("slab-1");
    expect(result.payout).toBe(2000); // 2 × ₹1000
  });

  it("calculates correct payout for tier 2 (5 units total)", () => {
    const sales = [
      makeSale("a", "Fortuner", 3),
      makeSale("b", "Camry", 2),
    ];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(5);
    expect(result.active_slab.id).toBe("slab-2");
    expect(result.payout).toBe(10000); // 5 × ₹2000
  });

  it("calculates correct payout for tier 3 (10 units total)", () => {
    const sales = [
      makeSale("a", "Fortuner", 5),
      makeSale("b", "Camry", 3),
      makeSale("c", "Hilux", 2),
    ];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(10);
    expect(result.active_slab.id).toBe("slab-3");
    expect(result.payout).toBe(35000); // 10 × ₹3500
  });

  // ── Boundary conditions ─────────────────────────────────────────────────

  it("picks the higher slab when total_units is exactly on a boundary (4 units)", () => {
    const sales = [makeSale("a", "Fortuner", 4)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(4);
    expect(result.active_slab.id).toBe("slab-2");
    expect(result.payout).toBe(8000); // 4 × ₹2000
  });

  it("picks tier 3 when total_units is exactly 8 (boundary)", () => {
    const sales = [makeSale("a", "Fortuner", 8)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(8);
    expect(result.active_slab.id).toBe("slab-3");
    expect(result.payout).toBe(28000); // 8 × ₹3500
  });

  // ── Next tier calculations ──────────────────────────────────────────────

  it("correctly calculates units_to_next_tier (2 units in tier 1 → 2 more to tier 2)", () => {
    const sales = [makeSale("a", "Fortuner", 2)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.units_to_next_tier).toBe(2); // need 4, have 2
  });

  it("correctly calculates bonus_at_next_tier (motivational delta)", () => {
    const sales = [makeSale("a", "Fortuner", 2)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    // Current: 2 × ₹1000 = ₹2000
    // At next tier: 4 × ₹2000 = ₹8000
    // Bonus = ₹8000 - ₹2000 = ₹6000
    expect(result.bonus_at_next_tier).toBe(6000);
  });

  it("returns units_to_next_tier = 0 when already at the top tier", () => {
    const sales = [makeSale("a", "Fortuner", 10)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.units_to_next_tier).toBe(0);
    expect(result.bonus_at_next_tier).toBe(0);
  });

  it("returns units_to_next_tier = 0 with a single open-ended slab", () => {
    const sales = [makeSale("a", "Fortuner", 5)];
    const result = calculateIncentive(sales, SINGLE_SLAB);

    expect(result.units_to_next_tier).toBe(0);
    expect(result.bonus_at_next_tier).toBe(0);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("handles empty sales array — payout 0, sentinel slab", () => {
    const result = calculateIncentive([], STANDARD_SLABS);

    expect(result.total_units).toBe(0);
    expect(result.payout).toBe(0);
    expect(result.active_slab.incentive_per_unit).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it("handles all units_sold being 0 — payout 0", () => {
    const sales = [
      makeSale("a", "Fortuner", 0),
      makeSale("b", "Camry", 0),
    ];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(0);
    expect(result.payout).toBe(0);
  });

  it("handles empty slabs array — payout 0 regardless of units", () => {
    const sales = [makeSale("a", "Fortuner", 5)];
    const result = calculateIncentive(sales, []);

    expect(result.total_units).toBe(5);
    expect(result.payout).toBe(0);
    expect(result.active_slab.incentive_per_unit).toBe(0);
  });

  it("works correctly with unsorted (reverse-order) slabs input", () => {
    const sales = [makeSale("a", "Fortuner", 5)];
    const result = calculateIncentive(sales, REVERSE_SLABS);

    expect(result.active_slab.id).toBe("slab-2");
    expect(result.payout).toBe(10000);
  });

  // ── Breakdown preservation ──────────────────────────────────────────────

  it("preserves the original sales array as breakdown", () => {
    const sales = [
      makeSale("a", "Fortuner", 3),
      makeSale("b", "Camry", 2),
    ];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0].car_name).toBe("Fortuner");
    expect(result.breakdown[0].units_sold).toBe(3);
    expect(result.breakdown[1].car_name).toBe("Camry");
    expect(result.breakdown[1].units_sold).toBe(2);
  });

  // ── Single sale ─────────────────────────────────────────────────────────

  it("works with a single car sale entry", () => {
    const sales = [makeSale("a", "Fortuner", 1)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(1);
    expect(result.active_slab.id).toBe("slab-1");
    expect(result.payout).toBe(1000);
    expect(result.units_to_next_tier).toBe(3); // need 4, have 1
  });

  // ── When 0 units but next tier guidance is provided ─────────────────────

  it("provides next tier guidance even when current payout is 0", () => {
    const result = calculateIncentive([], STANDARD_SLABS);

    // No active slab, but next slab should be the first one (min=1)
    expect(result.units_to_next_tier).toBe(1);
    // Bonus at next tier: 1 × ₹1000 - 0 = ₹1000
    expect(result.bonus_at_next_tier).toBe(1000);
  });

  // ── Large numbers ──────────────────────────────────────────────────────

  it("handles large unit counts correctly (50 units at top tier)", () => {
    const sales = [makeSale("a", "Fortuner", 50)];
    const result = calculateIncentive(sales, STANDARD_SLABS);

    expect(result.total_units).toBe(50);
    expect(result.active_slab.id).toBe("slab-3");
    expect(result.payout).toBe(175000); // 50 × ₹3500
    expect(result.units_to_next_tier).toBe(0);
  });
});
