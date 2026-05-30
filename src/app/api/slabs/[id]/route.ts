// ============================================================================
// Route: PUT /api/slabs/[id] — Update an incentive slab (admin only)
// Route: DELETE /api/slabs/[id] — Delete an incentive slab (admin only)
// ============================================================================
//
// PUT
//   Auth: Admin only
//   Params: id (UUID)
//   Body: { min_units?: number, max_units?: number | null, incentive_per_unit?: number }
//   Response: { data: IncentiveSlab, error: null, message: "Success" }
//   Errors: 400 (validation), 401, 403, 404, 409 (overlap after update)
//
// DELETE
//   Auth: Admin only
//   Params: id (UUID)
//   Response: { data: { id: string }, error: null, message: "Slab deleted" }
//   Errors: 400 (cannot delete last slab), 401, 403, 404
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";
import type { IncentiveSlab } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

function findOverlapExcluding(
  proposed: { min_units: number; max_units: number | null },
  existing: IncentiveSlab[],
  excludeId: string
): IncentiveSlab | null {
  for (const slab of existing) {
    if (slab.id === excludeId) continue;

    const existingMax = slab.max_units ?? Infinity;
    const proposedMax = proposed.max_units ?? Infinity;

    if (proposed.min_units <= existingMax && slab.min_units <= proposedMax) {
      return slab;
    }
  }
  return null;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { min_units, max_units, incentive_per_unit } = body as {
      min_units?: number;
      max_units?: number | null;
      incentive_per_unit?: number;
    };

    // ── Fetch the current slab to merge values ──────────────────────
    const { data: currentSlab, error: fetchCurrentError } = await supabase
      .from("incentive_slabs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchCurrentError) {
      if (fetchCurrentError.code === "PGRST116") return respond.notFound("Incentive slab");
      return respond.serverError(fetchCurrentError.message);
    }

    // ── Merge provided values with current ──────────────────────────
    const merged = {
      min_units: min_units ?? (currentSlab as IncentiveSlab).min_units,
      max_units:
        max_units !== undefined
          ? max_units
          : (currentSlab as IncentiveSlab).max_units,
      incentive_per_unit:
        incentive_per_unit ?? (currentSlab as IncentiveSlab).incentive_per_unit,
    };

    // ── Validation ──────────────────────────────────────────────────
    if (merged.min_units < 1) {
      return respond.badRequest("'min_units' must be >= 1");
    }

    if (
      merged.max_units !== null &&
      merged.max_units !== undefined &&
      merged.max_units <= merged.min_units
    ) {
      return respond.badRequest("'max_units' must be greater than 'min_units'");
    }

    if (merged.incentive_per_unit <= 0) {
      return respond.badRequest("'incentive_per_unit' must be > 0");
    }

    // ── Check for overlapping slabs (excluding self) ────────────────
    const { data: allSlabs, error: fetchAllError } = await supabase
      .from("incentive_slabs")
      .select("*");

    if (fetchAllError) return respond.serverError(fetchAllError.message);

    const overlap = findOverlapExcluding(
      { min_units: merged.min_units, max_units: merged.max_units ?? null },
      (allSlabs as IncentiveSlab[]) ?? [],
      id
    );

    if (overlap) {
      return respond.conflict(
        `Updated slab [${merged.min_units}–${merged.max_units ?? "∞"}] would overlap ` +
          `with slab [${overlap.min_units}–${overlap.max_units ?? "∞"}] (id: ${overlap.id})`
      );
    }

    // ── Update ──────────────────────────────────────────────────────
    const updates: Record<string, unknown> = {};
    if (min_units !== undefined) updates.min_units = min_units;
    if (max_units !== undefined) updates.max_units = max_units;
    if (incentive_per_unit !== undefined) updates.incentive_per_unit = incentive_per_unit;

    if (Object.keys(updates).length === 0) {
      return respond.badRequest("At least one field must be provided for update");
    }

    const { data, error } = await supabase
      .from("incentive_slabs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const { id } = await context.params;

    // ── Check slab count — prevent deleting the last one ────────────
    const { count, error: countError } = await supabase
      .from("incentive_slabs")
      .select("id", { count: "exact", head: true });

    if (countError) return respond.serverError(countError.message);

    if ((count ?? 0) <= 1) {
      return respond.badRequest(
        "Cannot delete the last incentive slab. At least one slab must remain."
      );
    }

    // ── Delete ──────────────────────────────────────────────────────
    const { error } = await supabase
      .from("incentive_slabs")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") return respond.notFound("Incentive slab");
      return respond.serverError(error.message);
    }

    return respond.success({ id }, "Slab deleted");
  } catch {
    return respond.serverError();
  }
}
