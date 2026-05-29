// ============================================================================
// Route: GET /api/slabs — List all incentive slabs
// Route: POST /api/slabs — Create a new incentive slab (admin only)
// ============================================================================
//
// GET
//   Auth: Any authenticated user
//   Query: None
//   Response: { data: IncentiveSlab[], error: null, message: "Success" }
//   Note: Slabs are returned sorted by min_units ASC.
//
// POST
//   Auth: Admin only
//   Body: { min_units: number, max_units: number | null, incentive_per_unit: number }
//   Response: { data: IncentiveSlab, error: null, message: "Created successfully" }
//   Errors: 400 (validation), 401, 403, 409 (overlapping slab)
//
//   Overlap detection: Before inserting, checks that no existing slab's range
//   overlaps with the new slab's range. Two slabs overlap if:
//     new.min_units <= existing.max_units AND new.max_units >= existing.min_units
//   (with NULL max_units treated as infinity)
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";
import type { IncentiveSlab } from "@/lib/types";

/**
 * Checks if a proposed slab range overlaps with any existing slab.
 *
 * @param proposed - The new slab's min/max range
 * @param existing - Array of existing slabs to check against
 * @returns The first overlapping slab, or null if no overlap
 */
function findOverlap(
  proposed: { min_units: number; max_units: number | null },
  existing: IncentiveSlab[]
): IncentiveSlab | null {
  for (const slab of existing) {
    const existingMax = slab.max_units ?? Infinity;
    const proposedMax = proposed.max_units ?? Infinity;

    // Two ranges [a, b] and [c, d] overlap if a <= d AND c <= b
    if (proposed.min_units <= existingMax && slab.min_units <= proposedMax) {
      return slab;
    }
  }
  return null;
}

/**
 * GET /api/slabs
 *
 * Returns all incentive slabs ordered by min_units ascending.
 * Accessible to any authenticated user (officers need slabs for
 * their incentive dashboard calculations).
 */
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();

    const { data, error } = await supabase
      .from("incentive_slabs")
      .select("*")
      .order("min_units", { ascending: true });

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

/**
 * POST /api/slabs
 *
 * Creates a new incentive slab. Admin only.
 * Validates:
 *   - min_units >= 1
 *   - max_units > min_units (if provided)
 *   - incentive_per_unit > 0
 *   - No overlap with existing slabs
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { min_units, max_units, incentive_per_unit } = body as {
      min_units?: number;
      max_units?: number | null;
      incentive_per_unit?: number;
    };

    // ── Validation ──────────────────────────────────────────────────
    if (min_units === undefined || typeof min_units !== "number" || min_units < 1) {
      return respond.badRequest("'min_units' is required and must be >= 1");
    }

    if (max_units !== undefined && max_units !== null) {
      if (typeof max_units !== "number" || max_units <= min_units) {
        return respond.badRequest("'max_units' must be greater than 'min_units'");
      }
    }

    if (
      incentive_per_unit === undefined ||
      typeof incentive_per_unit !== "number" ||
      incentive_per_unit <= 0
    ) {
      return respond.badRequest(
        "'incentive_per_unit' is required and must be > 0"
      );
    }

    // ── Check for overlapping slabs ─────────────────────────────────
    const { data: existingSlabs, error: fetchError } = await supabase
      .from("incentive_slabs")
      .select("*");

    if (fetchError) return respond.serverError(fetchError.message);

    const overlap = findOverlap(
      { min_units, max_units: max_units ?? null },
      (existingSlabs as IncentiveSlab[]) ?? []
    );

    if (overlap) {
      return respond.conflict(
        `New slab [${min_units}–${max_units ?? "∞"}] overlaps with existing slab ` +
          `[${overlap.min_units}–${overlap.max_units ?? "∞"}] (id: ${overlap.id})`
      );
    }

    // ── Insert ──────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("incentive_slabs")
      .insert({
        min_units,
        max_units: max_units ?? null,
        incentive_per_unit,
      })
      .select()
      .single();

    if (error) return respond.serverError(error.message);

    return respond.created(data);
  } catch {
    return respond.serverError();
  }
}
