// ============================================
// Toyota Incentive Portal — Server Supabase Client
// ============================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client instance for use in **Server Components**,
 * **Route Handlers**, and **Server Actions**.
 *
 * This client reads and writes auth cookies through Next.js's `cookies()` API,
 * keeping the server-side session in sync with the middleware-managed session.
 *
 * Must be called inside an async server context (e.g., a Server Component body,
 * a `POST` route handler, or a `"use server"` action).
 *
 * @returns A Supabase client bound to the current request's cookie session
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from "@/lib/supabase/server";
 *
 * export default async function DashboardPage() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("car_models").select("*");
 *   return <CarModelList models={data} />;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all cookies from the incoming request.
         * Used by Supabase to read the auth session token.
         */
        getAll() {
          return cookieStore.getAll();
        },

        /**
         * Sets cookies on the outgoing response.
         * Used by Supabase to refresh and persist auth tokens.
         *
         * Wrapped in try/catch because `cookies().set()` throws when called
         * from a Server Component (read-only context). This is expected —
         * the middleware handles token refresh for those cases.
         */
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // The middleware will handle cookie refresh on the next request.
          }
        },
      },
    }
  );
}
