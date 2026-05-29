// ============================================================================
// Toyota Incentive Portal — API Response Helpers
// ============================================================================
//
// Shared utilities for consistent API response formatting, authentication
// checks, and role authorization across all route handlers.
//
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

/**
 * Standard API response shape returned by all route handlers.
 *
 * @typeParam T - The type of the `data` payload (defaults to `unknown`)
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  message: string;
}

/**
 * Creates a typed JSON response with the standard API shape.
 *
 * @param body - The response body conforming to ApiResponse
 * @param status - HTTP status code (default 200)
 * @returns A NextResponse with JSON content-type
 */
export function apiResponse<T>(
  body: ApiResponse<T>,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(body, { status });
}

/**
 * Convenience helpers for common response patterns.
 */
export const respond = {
  /** 200 OK with data */
  success<T>(data: T, message = "Success") {
    return apiResponse({ data, error: null, message }, 200);
  },

  /** 201 Created with data */
  created<T>(data: T, message = "Created successfully") {
    return apiResponse({ data, error: null, message }, 201);
  },

  /** 400 Bad Request */
  badRequest(error: string) {
    return apiResponse({ data: null, error, message: "Validation failed" }, 400);
  },

  /** 401 Unauthorized — not logged in */
  unauthorized() {
    return apiResponse(
      { data: null, error: "Authentication required", message: "Unauthorized" },
      401
    );
  },

  /** 403 Forbidden — wrong role */
  forbidden(requiredRole: string) {
    return apiResponse(
      {
        data: null,
        error: `Requires ${requiredRole} role`,
        message: "Forbidden",
      },
      403
    );
  },

  /** 404 Not Found */
  notFound(resource: string) {
    return apiResponse(
      { data: null, error: `${resource} not found`, message: "Not found" },
      404
    );
  },

  /** 409 Conflict */
  conflict(error: string) {
    return apiResponse({ data: null, error, message: "Conflict" }, 409);
  },

  /** 500 Internal Server Error */
  serverError(error: string = "An unexpected error occurred") {
    return apiResponse(
      { data: null, error, message: "Internal server error" },
      500
    );
  },
} as const;

/**
 * Authenticates the current request and returns the user with their role.
 *
 * This function:
 * 1. Creates a server-side Supabase client
 * 2. Validates the session via `getUser()` (server-side JWT check)
 * 3. Fetches the user's role from the `user_roles` table
 * 4. Returns both the Supabase client and a hydrated `User` object
 *
 * @returns `{ supabase, user }` if authenticated, or `{ supabase: null, user: null }` if not
 *
 * @example
 * ```ts
 * const { supabase, user } = await getAuthenticatedUser();
 * if (!user) return respond.unauthorized();
 * ```
 */
export async function getAuthenticatedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
}> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { supabase, user: null };
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, full_name")
    .eq("user_id", authUser.id)
    .single();

  const user: User = {
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: roleData?.full_name ?? "",
    role: roleData?.role ?? "officer",
  };

  return { supabase, user };
}

/**
 * Validates that the authenticated user has the required role.
 *
 * @param user - The authenticated user (or null)
 * @param requiredRole - The role required for this operation
 * @returns An error NextResponse if unauthorized/forbidden, or null if authorized
 */
export function requireRole(
  user: User | null,
  requiredRole: "admin" | "officer"
): NextResponse | null {
  if (!user) return respond.unauthorized();
  if (user.role !== requiredRole) return respond.forbidden(requiredRole);
  return null;
}

/**
 * Validates that the authenticated user is an admin.
 *
 * @param user - The authenticated user (or null)
 * @returns An error NextResponse if unauthorized/forbidden, or null if authorized
 */
export function requireAdmin(user: User | null): NextResponse | null {
  return requireRole(user, "admin");
}
