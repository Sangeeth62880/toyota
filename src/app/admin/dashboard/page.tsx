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

/**
 * Toyota Incentive Portal — Administrative Overview Dashboard Page.
 *
 * Implements the core monitoring terminal for portal administrators:
 * - Master welcome header block with brand messaging and noise-textured design.
 * - Interactive metric summary grids (Stats Row) wrapped in a custom lazy Suspense boundary.
 * - Multi-column responsive layout grouping car sales breakdown tables (left)
 *   and log transaction timeline activity lists (right).
 * - Streamed HTML loading states using custom-tailored gray pulsate skeletons.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Compute current month first-day string "YYYY-MM-01" to fetch total units
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
      {/* Branded Welcome Header Banner */}
      <WelcomeBanner totalSales={totalSales} />

      {/* Stats Cards Row */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Midsection Core Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Car Model Performance Breakdown */}
        <div className="lg:col-span-7 w-full min-w-0">
          <Suspense fallback={<PerformanceSkeleton />}>
            <PerformanceSection />
          </Suspense>
        </div>

        {/* Right Hand: Log Activity Timeline Feed */}
        <div className="lg:col-span-5 w-full min-w-0">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeedSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

