// ============================================================================
// Route: GET /api/sales — Query sales entries with car model details
// Route: POST /api/sales — Upsert a single sales entry (officer only)
// ============================================================================
//
// GET
//   Auth: Any authenticated user (scoped by role)
//   Query params:
//     month     (required) — format "YYYY-MM" (e.g. "2025-06")
//     officer_id (optional) — UUID; admins can query any officer, officers
//                             can only query themselves (param is ignored)
//   Response: {
//     data: Array<{
//       id, officer_id, car_model_id, month, units_sold, created_at, updated_at,
//       car_models: { name, variant, image_url }
//     }>,
//     error: null,
//     message: "Success"
//   }
//
// POST
//   Auth: Officer only
//   Body: { car_model_id: string, month: string, units_sold: number }
//   Response: { data: SalesEntry, error: null, message: "Created successfully" }
//   Note: Uses Supabase UPSERT on (officer_id, car_model_id, month) constraint.
//         If an entry already exists for this combination, units_sold is updated.
//   Errors: 400 (validation), 401, 403
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  respond,
} from "@/lib/api-helpers";

/** Validates a month string is in YYYY-MM format and represents a real month. */
function isValidMonth(month: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(month);
}

/** Converts "YYYY-MM" to "YYYY-MM-01" (first day of month, as stored in DB). */
function toMonthDate(month: string): string {
  return `${month}-01`;
}

/**
 * GET /api/sales
 *
 * Queries sales entries for a given month, joined with car model details.
 *
 * Role-based scoping:
 * - Officers: Can only see their own entries (officer_id param ignored)
 * - Admins: Can see any officer's entries, or all if officer_id omitted
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const officerIdParam = searchParams.get("officer_id");

    // ── Validation ──────────────────────────────────────────────────
    if (!month) {
      return respond.badRequest("'month' query parameter is required (format: YYYY-MM)");
    }

    if (!isValidMonth(month)) {
      return respond.badRequest("'month' must be in YYYY-MM format (e.g. 2025-06)");
    }

    // ── Build query ─────────────────────────────────────────────────
    const monthDate = toMonthDate(month);

    let query = supabase
      .from("sales_entries")
      .select(
        `
        id,
        officer_id,
        car_model_id,
        month,
        units_sold,
        created_at,
        updated_at,
        car_models (
          name,
          variant,
          image_url
        )
      `
      )
      .eq("month", monthDate);

    // Scope by role
    if (user.role === "officer") {
      // Officers can ONLY see their own data
      query = query.eq("officer_id", user.id);
    } else if (officerIdParam) {
      // Admins can filter by specific officer
      query = query.eq("officer_id", officerIdParam);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

/**
 * POST /api/sales
 *
 * Creates or updates a single sales entry. Officer only.
 *
 * Uses Supabase upsert with `onConflict: "officer_id,car_model_id,month"`
 * so that repeat submissions for the same (officer, car, month) update
 * the existing row rather than creating duplicates.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();
    if (user.role !== "officer") return respond.forbidden("officer");

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { car_model_id, month, units_sold } = body as {
      car_model_id?: string;
      month?: string;
      units_sold?: number;
    };

    // ── Validation ──────────────────────────────────────────────────
    if (!car_model_id || typeof car_model_id !== "string") {
      return respond.badRequest("'car_model_id' is required (UUID string)");
    }

    if (!month || typeof month !== "string" || !isValidMonth(month)) {
      return respond.badRequest("'month' is required in YYYY-MM format");
    }

    if (units_sold === undefined || typeof units_sold !== "number" || units_sold < 0) {
      return respond.badRequest("'units_sold' is required and must be >= 0");
    }

    if (!Number.isInteger(units_sold)) {
      return respond.badRequest("'units_sold' must be a whole number");
    }

    // ── Upsert ──────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("sales_entries")
      .upsert(
        {
          officer_id: user.id,
          car_model_id,
          month: toMonthDate(month),
          units_sold,
        },
        { onConflict: "officer_id,car_model_id,month" }
      )
      .select()
      .single();

    if (error) return respond.serverError(error.message);

    return respond.created(data);
  } catch {
    return respond.serverError();
  }
}
