import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SalesDashboard from "@/components/officer/SalesDashboard";
import { ROUTES } from "@/lib/constants";

export default async function OfficerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

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
