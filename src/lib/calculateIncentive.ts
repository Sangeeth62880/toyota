import type { CarSale, IncentiveResult, IncentiveSlab } from "@/lib/types";

const NULL_SLAB: IncentiveSlab = {
  id: "",
  min_units: 0,
  max_units: 0,
  incentive_per_unit: 0,
  updated_at: "",
};

function sortSlabs(slabs: IncentiveSlab[]): IncentiveSlab[] {
  return [...slabs].sort((a, b) => a.min_units - b.min_units);
}

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

export function getProgressToNextTier(
  units: number,
  slabs: IncentiveSlab[]
): number {
  const activeSlab = getSlabForUnits(units, slabs);

  if (!activeSlab) return 0;

  if (activeSlab.max_units === null) return 100;

  const tierSpan = activeSlab.max_units - activeSlab.min_units + 1;
  const unitsIntoTier = units - activeSlab.min_units;

  const progress = (unitsIntoTier / tierSpan) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

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
 */
export function calculateIncentive(
  sales: CarSale[],
  slabs: IncentiveSlab[]
): IncentiveResult {
  const total_units = sales.reduce((sum, sale) => sum + sale.units_sold, 0);

  const activeSlab = getSlabForUnits(total_units, slabs);
  const active_slab: IncentiveSlab = activeSlab ?? NULL_SLAB;

  const payout = total_units * active_slab.incentive_per_unit;

  const sorted = sortSlabs(slabs);

  // The next slab is the first one whose min_units is strictly greater
  // than the active slab's min_units
  const nextSlab = activeSlab
    ? sorted.find((s) => s.min_units > activeSlab.min_units) ?? null
    : sorted.length > 0
      ? sorted[0]
      : null;

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

  return {
    total_units,
    active_slab,
    payout,
    units_to_next_tier,
    bonus_at_next_tier,
    breakdown: sales,
  };
}
