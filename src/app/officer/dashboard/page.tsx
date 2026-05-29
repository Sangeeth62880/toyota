import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SalesDashboard from "@/components/officer/SalesDashboard";
import { ROUTES } from "@/lib/constants";

/**
 * Toyota Incentive Portal — Sales Officer Dashboard Server Page.
 *
 * Implements the server page gateway:
 * - Validates current sales officer session and context.
 * - Programmatically computes current month boundaries dynamically.
 * - Performs parallel Supabase database queries for active models,
 *   sorted incentive slabs, and current month logged entries.
 * - Mounts the fully interactive Client-Side Sales Calculator Dashboard.
 */
export default async function OfficerDashboardPage() {
  const supabase = await createClient();

  // 1. Authenticate user context session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Calculate current month date: "YYYY-MM-01"
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  // 2. Parallel fetch active vehicles, sorted slabs, and logged entries
  const carsPromise = supabase
    .from("car_models")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const slabsPromise = supabase
    .from("incentive_slabs")
    .select("*")
    .order("min_units", { ascending: true });

  const salesPromise = supabase
    .from("sales_entries")
    .select("*")
    .eq("officer_id", user.id)
    .eq("month", monthString);

  const [carsRes, slabsRes, salesRes] = await Promise.all([
    carsPromise,
    slabsPromise,
    salesPromise,
  ]);

  return (
    <div className="w-full">
      <SalesDashboard
        cars={carsRes.data || []}
        slabs={slabsRes.data || []}
        existingSales={salesRes.data || []}
      />
    </div>
  );
}
