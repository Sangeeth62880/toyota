// ============================================================================
// Toyota Incentive Portal — Incentive Calculation Engine
// ============================================================================
//
// Pure functions for computing sales officer incentive payouts.
// Zero side effects, zero database calls — fully unit-testable.
//
// ============================================================================

import type { CarSale, IncentiveResult, IncentiveSlab } from "@/lib/types";

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Sentinel slab representing "no qualifying slab".
 *
 * Used when total_units is 0 or no slab's min_units is met.
 * Avoids nullable active_slab in the return type while keeping
 * the result semantically correct (payout = 0).
 */
const NULL_SLAB: IncentiveSlab = {
  id: "",
  min_units: 0,
  max_units: 0,
  incentive_per_unit: 0,
  updated_at: "",
};

/**
 * Returns a new array of slabs sorted ascending by `min_units`.
 *
 * Does NOT mutate the input array. This ensures the calculation
 * logic works correctly regardless of the input ordering.
 *
 * @param slabs - Unsorted array of incentive slabs
 * @returns A new array sorted by min_units ascending
 */
function sortSlabs(slabs: IncentiveSlab[]): IncentiveSlab[] {
  return [...slabs].sort((a, b) => a.min_units - b.min_units);
}

// ─── Exported Helpers ───────────────────────────────────────────────────────

/**
 * Finds the highest qualifying incentive slab for a given unit count.
 *
 * A slab qualifies when `units >= slab.min_units`. When multiple slabs
 * qualify, the one with the highest `min_units` wins (i.e. the most
 * lucrative tier).
 *
 * @param units - Total units sold in the period
 * @param slabs - Array of incentive slabs (any order — sorted internally)
 * @returns The matching slab, or `null` if no slab qualifies (e.g. 0 units)
 *
 * @example
 * ```ts
 * const slab = getSlabForUnits(5, slabs);
 * // → slab with min_units=4, max_units=7, incentive_per_unit=2000
 * ```
 */
export function getSlabForUnits(
  units: number,
  slabs: IncentiveSlab[]
): IncentiveSlab | null {
  if (units <= 0 || slabs.length === 0) return null;

  const sorted = sortSlabs(slabs);

  // Walk backwards from the highest slab to find the first one that qualifies
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (units >= sorted[i].min_units) {
      return sorted[i];
    }
  }

  return null;
}

/**
 * Calculates the percentage progress within the current incentive tier.
 *
 * Returns a value between 0 and 100:
 * - 0%   → just entered the current tier (at min_units)
 * - 100% → at the threshold of the next tier
 *
 * If the officer is already in the top tier (max_units = null),
 * returns 100 (fully maxed out).
 *
 * If no slab qualifies (0 units), returns 0.
 *
 * @param units - Total units sold in the period
 * @param slabs - Array of incentive slabs (any order — sorted internally)
 * @returns Progress percentage (0–100), clamped
 *
 * @example
 * ```ts
 * // Slab: 4–7 units, officer sold 5
 * getProgressToNextTier(5, slabs) // → 33.33 (1 of 3 steps through the tier)
 * ```
 */
export function getProgressToNextTier(
  units: number,
  slabs: IncentiveSlab[]
): number {
  const activeSlab = getSlabForUnits(units, slabs);

  // No qualifying slab → 0% progress
  if (!activeSlab) return 0;

  // Top tier (open-ended) → 100%
  if (activeSlab.max_units === null) return 100;

  // Calculate progress within the tier
  const tierSpan = activeSlab.max_units - activeSlab.min_units + 1;
  const unitsIntoTier = units - activeSlab.min_units;

  // Clamp to 0–100
  const progress = (unitsIntoTier / tierSpan) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

// ─── Main Calculation ───────────────────────────────────────────────────────

/**
 * Computes the full incentive result for a sales officer's monthly performance.
 *
 * This is a **pure function** — it takes sales data and slab configuration
 * as inputs and returns a deterministic result with no side effects.
 *
 * **Algorithm:**
 * 1. Sum `units_sold` across all `CarSale` entries → `total_units`
 * 2. Find the highest qualifying slab via `getSlabForUnits()`
 * 3. Calculate payout: `total_units × active_slab.incentive_per_unit`
 * 4. Find the next tier and compute motivational "what if" data
 * 5. Return the complete `IncentiveResult`
 *
 * **Edge cases handled:**
 * - Empty sales array → payout 0, sentinel null-slab
 * - All units_sold = 0 → payout 0
 * - Boundary values (e.g. exactly 4 units) → picks the higher slab
 * - Unsorted slabs → sorted internally before processing
 * - Single open-ended slab → units_to_next_tier = 0
 *
 * @param sales - Array of per-car-model sales entries for the period
 * @param slabs - Array of incentive slabs (any order)
 * @returns Complete incentive calculation result
 *
 * @example
 * ```ts
 * const result = calculateIncentive(
 *   [
 *     { car_model_id: "a", car_name: "Fortuner", image_url: "", units_sold: 3 },
 *     { car_model_id: "b", car_name: "Camry",    image_url: "", units_sold: 2 },
 *   ],
 *   slabs
 * );
 * // result.total_units → 5
 * // result.payout → 10000 (5 × ₹2000)
 * ```
 */
export function calculateIncentive(
  sales: CarSale[],
  slabs: IncentiveSlab[]
): IncentiveResult {
  // ─── 1. Aggregate total units ──────────────────────────────────────
  const total_units = sales.reduce((sum, sale) => sum + sale.units_sold, 0);

  // ─── 2. Find active slab ──────────────────────────────────────────
  const activeSlab = getSlabForUnits(total_units, slabs);
  const active_slab: IncentiveSlab = activeSlab ?? NULL_SLAB;

  // ─── 3. Calculate payout ──────────────────────────────────────────
  const payout = total_units * active_slab.incentive_per_unit;

  // ─── 4. Find next tier ────────────────────────────────────────────
  const sorted = sortSlabs(slabs);

  // The next slab is the first one whose min_units is strictly greater
  // than the active slab's min_units
  const nextSlab = activeSlab
    ? sorted.find((s) => s.min_units > activeSlab.min_units) ?? null
    : sorted.length > 0
      ? sorted[0]
      : null;

  // ─── 5. Compute motivational data ────────────────────────────────
  let units_to_next_tier: number;
  let bonus_at_next_tier: number;

  if (nextSlab) {
    units_to_next_tier = Math.max(0, nextSlab.min_units - total_units);
    // Bonus = what they'd earn at next tier's rate minus current payout
    // "If you sell X more units, you'd earn THIS much more total"
    bonus_at_next_tier =
      nextSlab.min_units * nextSlab.incentive_per_unit - payout;
  } else {
    // Already at the top tier (or no slabs at all)
    units_to_next_tier = 0;
    bonus_at_next_tier = 0;
  }

  // ─── 6. Build result ─────────────────────────────────────────────
  return {
    total_units,
    active_slab,
    payout,
    units_to_next_tier,
    bonus_at_next_tier,
    breakdown: sales,
  };
}
