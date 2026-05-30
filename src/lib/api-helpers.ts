import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  message: string;
}

export function apiResponse<T>(
  body: ApiResponse<T>,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(body, { status });
}

export const respond = {
  success<T>(data: T, message = "Success") {
    return apiResponse({ data, error: null, message }, 200);
  },

  created<T>(data: T, message = "Created successfully") {
    return apiResponse({ data, error: null, message }, 201);
  },

  badRequest(error: string) {
    return apiResponse({ data: null, error, message: "Validation failed" }, 400);
  },

  unauthorized() {
    return apiResponse(
      { data: null, error: "Authentication required", message: "Unauthorized" },
      401
    );
  },

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

  notFound(resource: string) {
    return apiResponse(
      { data: null, error: `${resource} not found`, message: "Not found" },
      404
    );
  },

  conflict(error: string) {
    return apiResponse({ data: null, error, message: "Conflict" }, 409);
  },

  serverError(error: string = "An unexpected error occurred") {
    return apiResponse(
      { data: null, error, message: "Internal server error" },
      500
    );
  },
} as const;

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

export function requireRole(
  user: User | null,
  requiredRole: "admin" | "officer"
): NextResponse | null {
  if (!user) return respond.unauthorized();
  if (user.role !== requiredRole) return respond.forbidden(requiredRole);
  return null;
}

export function requireAdmin(user: User | null): NextResponse | null {
  return requireRole(user, "admin");
}
