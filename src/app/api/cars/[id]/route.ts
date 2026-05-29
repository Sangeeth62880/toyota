// ============================================================================
// Route: PUT /api/cars/[id] — Update a car model (admin only)
// Route: DELETE /api/cars/[id] — Soft-delete a car model (admin only)
// ============================================================================
//
// PUT
//   Auth: Admin only
//   Params: id (UUID)
//   Body: { name?: string, variant?: string, image_url?: string, is_active?: boolean }
//   Response: { data: CarModel, error: null, message: "Success" }
//   Errors: 400 (empty name), 401, 403, 404 (car not found)
//
// DELETE
//   Auth: Admin only
//   Params: id (UUID)
//   Response: { data: CarModel, error: null, message: "Car model deactivated" }
//   Note: This is a SOFT delete — sets is_active=false, does not remove the row.
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/cars/[id]
 *
 * Updates an existing car model. Admin only.
 * Only provided fields are updated (partial patch).
 * Validates name is non-empty if provided.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { name, variant, image_url, is_active } = body as {
      name?: string;
      variant?: string;
      image_url?: string;
      is_active?: boolean;
    };

    // ── Validation ──────────────────────────────────────────────────
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return respond.badRequest("'name' must be a non-empty string");
    }

    // ── Build update payload (only provided fields) ─────────────────
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (variant !== undefined) updates.variant = variant?.trim() ?? null;
    if (image_url !== undefined) updates.image_url = image_url?.trim() ?? null;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return respond.badRequest("At least one field must be provided for update");
    }

    // ── Update ──────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("car_models")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return respond.notFound("Car model");
      return respond.serverError(error.message);
    }

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

/**
 * DELETE /api/cars/[id]
 *
 * Deletes a car model physically from the database.
 * Admin only. Catches foreign key constraint violation (error code 23503)
 * if referencing sales entries exist.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const { id } = await context.params;

    const { data, error } = await supabase
      .from("car_models")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return respond.notFound("Car model");
      if (error.code === "23503") {
        return respond.conflict(
          "This model has existing sales records and cannot be deleted."
        );
      }
      return respond.serverError(error.message);
    }

    return respond.success(data, "Car model deleted successfully");
  } catch {
    return respond.serverError();
  }
}
