import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 *
 * This bypasses Row Level Security, which is necessary for test setup/teardown
 * operations that modify data across user boundaries.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Resets the test officer's sales_entries for the current month.
 *
 * Sets all `units_sold` to 0 for the test officer so that calculator
 * tests begin from a clean baseline.  If no entries exist yet the
 * function completes silently — no rows to update means tests will
 * start at 0 naturally.
 */
export async function resetTestData(): Promise<void> {
  const officerId = process.env.TEST_OFFICER_ID;
  if (!officerId) {
    console.warn(
      "TEST_OFFICER_ID not set in .env.test — skipping resetTestData"
    );
    return;
  }

  const supabase = getServiceClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  const { error } = await supabase
    .from("sales_entries")
    .delete()
    .eq("officer_id", officerId)
    .eq("month", monthString);

  if (error) {
    console.error("resetTestData failed:", error.message);
    throw error;
  }
}
