import { createClient } from "@/lib/supabase/server";
import { Car, Users, TrendingUp } from "lucide-react";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 flex flex-col justify-between min-h-[148px]"
        >
          <div className="w-9 h-9 bg-gray-200 rounded-[4px] mb-4" />
          <div className="h-8 bg-gray-200 rounded-[4px] w-24 mb-2" />
          <div className="h-4 bg-gray-200 rounded-[4px] w-32" />
        </div>
      ))}
    </div>
  );
}

export default async function StatsSection() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  const modelsPromise = supabase
    .from("car_models")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const officersPromise = supabase
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "officer");

  const salesPromise = supabase
    .from("sales_entries")
    .select("units_sold, officer_id")
    .eq("month", monthString);

  const rolesPromise = supabase
    .from("user_roles")
    .select("user_id, full_name")
    .eq("role", "officer");

  const [modelsRes, officersRes, salesRes, rolesRes] = await Promise.all([
    modelsPromise,
    officersPromise,
    salesPromise,
    rolesPromise,
  ]);

  const activeModelsCount = modelsRes.count || 0;
  const officersCount = officersRes.count || 0;
  const totalSales = salesRes.data?.reduce((acc, s) => acc + s.units_sold, 0) || 0;

  const officerSalesMap: Record<string, number> = {};
  salesRes.data?.forEach((entry) => {
    officerSalesMap[entry.officer_id] =
      (officerSalesMap[entry.officer_id] || 0) + entry.units_sold;
  });

  let topOfficerId = "";
  let maxUnits = 0;
  Object.entries(officerSalesMap).forEach(([id, units]) => {
    if (units > maxUnits) {
      maxUnits = units;
      topOfficerId = id;
    }
  });

  const topOfficerName =
    rolesRes.data?.find((r) => r.user_id === topOfficerId)?.full_name || "";

  const stats = [
    {
      label: "Active Models",
      value: activeModelsCount,
      icon: Car,
    },
    {
      label: "Sales Officers",
      value: officersCount,
      icon: Users,
    },
    {
      label: "Cars Sold This Month",
      value: totalSales,
      icon: TrendingUp,
      isPrimary: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none font-sans">
      {stats.map((stat, idx) => {
        return (
          <div
            key={idx}
            className="bg-white border border-[#E5E5E5] p-6 flex flex-col justify-center min-h-[148px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md border-b-2 border-b-[#E5E5E5] rounded-[4px]"
          >
            <h2 className="font-sans font-extrabold text-[#0A0A0A] leading-tight tracking-tight text-[36px]">
              {stat.value}
            </h2>

            <p className="font-sans font-bold text-[14px] text-[#555555] uppercase tracking-wider leading-none mt-2">
              {stat.label}
            </p>
          </div>
        );
      })}

      <div className="bg-white border border-[#E5E5E5] p-6 flex flex-col justify-center min-h-[148px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md border-b-2 rounded-[4px] border-b-[#E5E5E5]">
        {topOfficerId && maxUnits > 0 ? (
          <>
            <h2
              className="font-sans font-extrabold text-[#0A0A0A] leading-tight tracking-tight text-[28px] truncate w-full"
              title={topOfficerName}
            >
              {topOfficerName}
            </h2>
            <p className="font-sans font-normal text-[18px] text-[#555555] mt-1.5 leading-none">
              ({maxUnits} units)
            </p>
          </>
        ) : (
          <h2 className="font-sans font-extrabold text-[#0A0A0A] leading-tight tracking-tight text-[36px]">
            —
          </h2>
        )}

        <p className="font-sans font-bold text-[14px] text-[#555555] uppercase tracking-wider leading-none mt-2">
          Top Officer
        </p>
      </div>
    </div>
  );
}
