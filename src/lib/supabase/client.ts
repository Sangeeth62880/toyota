// ============================================
// Toyota Incentive Portal — Browser Supabase Client
// ============================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client instance for use in **client components** (browser).
 *
 * This client automatically manages auth tokens via cookies set by the
 * middleware and server client. It should be called inside React components,
 * event handlers, or `useEffect` hooks — never in server-only code.
 *
 * Environment variables `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in `.env.local`.
 *
 * @returns A typed Supabase client bound to the browser session
 *
 * @example
 * ```tsx
 * "use client";
 * import { createClient } from "@/lib/supabase/client";
 *
 * export function SalesForm() {
 *   const supabase = createClient();
 *   // Use supabase.from("sales_entries").insert(...)
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
