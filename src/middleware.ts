// ============================================
// Toyota Incentive Portal — Route Middleware
// ============================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLES, ROUTES } from "@/lib/constants";

/**
 * Public routes that do not require authentication.
 *
 * These paths are excluded from the auth redirect logic so that
 * unauthenticated users can access the login page and static assets.
 */
const PUBLIC_ROUTES = new Set([ROUTES.LOGIN, "/auth/callback"]);

/**
 * Next.js middleware that runs on every matched request.
 *
 * Responsibilities:
 * 1. **Session refresh** — Uses Supabase SSR to read/write auth cookies,
 *    ensuring tokens stay fresh across requests.
 * 2. **Authentication gate** — Redirects unauthenticated users to `/login`
 *    for all protected routes.
 * 3. **Role-based routing** — Prevents admins from accessing officer routes
 *    and vice versa, redirecting them to their respective dashboards.
 * 4. **Root redirect** — Sends `/` to the appropriate dashboard based on role.
 *
 * @param request - The incoming Next.js request
 * @returns A `NextResponse` — either a redirect or the original response with
 *          updated auth cookies
 */
export async function middleware(request: NextRequest) {
  // ─── ERROR 1 FIX: Guard against undefined env variables in Edge Runtime ───
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ─── ERROR 2 FIX: Strict single response stream pattern ──────────────────
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never)
        );
      },
    },
  });

  // Refresh active session using secure server verification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Helper to return a redirect response while preserving all refreshed cookies
  const redirect = (targetUrl: string | URL) => {
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // ─── 3. Allow public routes unconditionally ────────────────────────
  if (PUBLIC_ROUTES.has(pathname)) {
    // If an authenticated user visits /login, redirect to their dashboard
    if (user && pathname === ROUTES.LOGIN) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const role = roleData?.role;
      const dashboardUrl =
        role === ROLES.ADMIN
          ? ROUTES.ADMIN_DASHBOARD
          : ROUTES.OFFICER_DASHBOARD;

      return redirect(dashboardUrl);
    }

    return response;
  }

  // ─── 4. Redirect unauthenticated users to login ───────────────────
  if (!user) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirect(loginUrl);
  }

  // ─── 5. Fetch user role for authorization ─────────────────────────
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role;

  // ─── 6. Role-based route protection ───────────────────────────────
  // Admins cannot access officer routes
  if (role === ROLES.ADMIN && pathname.startsWith("/officer")) {
    return redirect(ROUTES.ADMIN_DASHBOARD);
  }

  // Officers cannot access admin routes
  if (role === ROLES.OFFICER && pathname.startsWith("/admin")) {
    return redirect(ROUTES.OFFICER_DASHBOARD);
  }

  // ─── 7. Root redirect based on role ───────────────────────────────
  if (pathname === "/") {
    const dashboardUrl =
      role === ROLES.ADMIN
        ? ROUTES.ADMIN_DASHBOARD
        : ROUTES.OFFICER_DASHBOARD;

    return redirect(dashboardUrl);
  }

  return response;
}

/**
 * Middleware matcher configuration.
 *
 * Runs the middleware on all routes EXCEPT:
 * - `_next/static` — Next.js static assets (JS/CSS bundles)
 * - `_next/image` — Next.js image optimization API
 * - `favicon.ico` — Browser favicon request
 * - Static file extensions (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

