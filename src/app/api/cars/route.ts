// ============================================================================
// Route: GET /api/cars — List all active car models
// Route: POST /api/cars — Create a new car model (admin only)
// ============================================================================
//
// GET
//   Auth: Any authenticated user
//   Query: None
//   Response: { data: CarModel[], error: null, message: "Success" }
//
// POST
//   Auth: Admin only
//   Body: { name: string, variant?: string, image_url?: string }
//   Response: { data: CarModel, error: null, message: "Created successfully" }
//   Errors: 400 (missing/empty name), 401, 403
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";

/**
 * GET /api/cars
 *
 * Returns all active car models, ordered by name.
 * Accessible to any authenticated user (officers need this to populate
 * the sales entry form).
 */
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();

    const { data, error } = await supabase
      .from("car_models")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

/**
 * POST /api/cars
 *
 * Creates a new car model. Admin only.
 * Validates that `name` is a non-empty string.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { name, variant, image_url } = body as {
      name?: string;
      variant?: string;
      image_url?: string;
    };

    // ── Validation ──────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return respond.badRequest("'name' is required and must be a non-empty string");
    }

    // ── Insert ──────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("car_models")
      .insert({
        name: name.trim(),
        variant: variant?.trim() ?? null,
        image_url: image_url?.trim() ?? null,
      })
      .select()
      .single();

    if (error) return respond.serverError(error.message);

    return respond.created(data);
  } catch {
    return respond.serverError();
  }
}
