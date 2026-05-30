import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import WelcomeBanner from "./_components/WelcomeBanner";
import StatsSection, { StatsSkeleton } from "@/components/admin/StatsSection";
import PerformanceSection, {
  PerformanceSkeleton,
} from "@/components/admin/PerformanceSection";
import ActivityFeedSection, {
  ActivityFeedSkeleton,
} from "@/components/admin/ActivityFeedSection";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  const { data: salesData } = await supabase
    .from("sales_entries")
    .select("units_sold")
    .eq("month", monthString);

  const totalSales = salesData?.reduce((acc, s) => acc + s.units_sold, 0) || 0;

  return (
    <div className="space-y-8 select-none">

      <WelcomeBanner totalSales={totalSales} />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <div className="lg:col-span-7 w-full min-w-0">
          <Suspense fallback={<PerformanceSkeleton />}>
            <PerformanceSection />
          </Suspense>
        </div>

        <div className="lg:col-span-5 w-full min-w-0">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeedSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

