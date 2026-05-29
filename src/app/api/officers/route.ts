// ============================================================================
// Route: GET /api/officers — List all sales officers (admin only)
// ============================================================================
//
// GET
//   Auth: Admin only
//   Query: None
//   Response: {
//     data: Array<{
//       user_id: string,
//       role: "officer",
//       full_name: string,
//       created_at: string,
//       email: string          // joined from auth.users via RPC or lookup
//     }>,
//     error: null,
//     message: "Success"
//   }
//   Errors: 401, 403
//
//   Note: Since auth.users is not directly queryable via the PostgREST API,
//   we fetch user_roles and then batch-lookup emails from auth. For simplicity,
//   we return user_roles data and the email will be populated by the admin
//   user management features using Supabase Admin API if needed.
//
// ============================================================================

import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";

/**
 * GET /api/officers
 *
 * Returns all users with role='officer'. Admin only.
 *
 * Used by the admin dashboard to display the officer list,
 * view individual performance, and manage team members.
 */
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role, full_name, created_at")
      .eq("role", "officer")
      .order("full_name", { ascending: true });

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}
