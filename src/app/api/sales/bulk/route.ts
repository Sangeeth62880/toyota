// ============================================================================
// Route: POST /api/sales/bulk — Bulk upsert sales entries (officer only)
// ============================================================================
//
// POST
//   Auth: Officer only
//   Body: {
//     month: string,                          // "YYYY-MM" format
//     entries: Array<{
//       car_model_id: string,                 // UUID
//       units_sold: number                    // >= 0, integer
//     }>
//   }
//   Response: {
//     data: SalesEntry[],
//     error: null,
//     message: "Bulk upsert completed (N entries)"
//   }
//   Errors: 400 (validation), 401, 403
//
//   This route uses a SINGLE Supabase upsert call (not a loop) for
//   optimal performance. All entries share the same officer_id and month.
//   The unique constraint (officer_id, car_model_id, month) is used for
//   conflict resolution — existing entries are updated in place.
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  respond,
} from "@/lib/api-helpers";

/** Validates a month string is in YYYY-MM format. */
function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

/** Converts "YYYY-MM" to "YYYY-MM-01". */
function toMonthDate(month: string): string {
  return `${month}-01`;
}

/** Shape of each entry in the bulk request body. */
interface BulkSaleEntry {
  car_model_id: string;
  units_sold: number;
}

/**
 * POST /api/sales/bulk
 *
 * Bulk upserts multiple sales entries for a given month. Officer only.
 *
 * All entries inherit the authenticated officer's ID and the shared month.
 * Uses a single Supabase upsert call for performance — no N+1 queries.
 *
 * Validation is strict:
 * - `month` must be valid YYYY-MM format
 * - `entries` must be a non-empty array
 * - Each entry must have a valid `car_model_id` (string) and `units_sold` (integer >= 0)
 * - Duplicate car_model_ids within the batch are rejected
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();
    if (user.role !== "officer") return respond.forbidden("officer");

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { month, entries } = body as {
      month?: string;
      entries?: BulkSaleEntry[];
    };

    // ── Validate month ──────────────────────────────────────────────
    if (!month || typeof month !== "string" || !isValidMonth(month)) {
      return respond.badRequest("'month' is required in YYYY-MM format");
    }

    // ── Validate entries array ──────────────────────────────────────
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return respond.badRequest("'entries' must be a non-empty array");
    }

    // ── Validate each entry ─────────────────────────────────────────
    const seenCarModelIds = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (!entry.car_model_id || typeof entry.car_model_id !== "string") {
        return respond.badRequest(
          `entries[${i}]: 'car_model_id' is required (UUID string)`
        );
      }

      if (
        entry.units_sold === undefined ||
        typeof entry.units_sold !== "number" ||
        entry.units_sold < 0
      ) {
        return respond.badRequest(
          `entries[${i}]: 'units_sold' is required and must be >= 0`
        );
      }

      if (!Number.isInteger(entry.units_sold)) {
        return respond.badRequest(
          `entries[${i}]: 'units_sold' must be a whole number`
        );
      }

      // Check for duplicate car_model_ids in the same batch
      if (seenCarModelIds.has(entry.car_model_id)) {
        return respond.badRequest(
          `entries[${i}]: duplicate car_model_id '${entry.car_model_id}' in batch`
        );
      }
      seenCarModelIds.add(entry.car_model_id);
    }

    // ── Build upsert payload ────────────────────────────────────────
    const monthDate = toMonthDate(month);

    const rows = entries.map((entry) => ({
      officer_id: user.id,
      car_model_id: entry.car_model_id,
      month: monthDate,
      units_sold: entry.units_sold,
    }));

    // ── Single upsert call ──────────────────────────────────────────
    const { data, error } = await supabase
      .from("sales_entries")
      .upsert(rows, { onConflict: "officer_id,car_model_id,month" })
      .select();

    if (error) return respond.serverError(error.message);

    return respond.created(
      data,
      `Bulk upsert completed (${entries.length} entries)`
    );
  } catch {
    return respond.serverError();
  }
}
