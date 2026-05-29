import { createClient } from "@/lib/supabase/server";

/**
 * Pulse Loader Skeleton for the Performance Section.
 */
export function PerformanceSkeleton() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded-[4px] w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 justify-between h-[40px]">
            <div className="h-4 bg-gray-200 rounded-[4px] w-1/3" />
            <div className="h-4 bg-gray-200 rounded-[4px] w-16" />
            <div className="h-3 bg-gray-200 rounded-[4px] w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PerformanceSection Component.
 *
 * Displays car model sales volume and market share breakdown.
 * - Table header: Car Model | Units Sold | Share (% of total)
 * - Custom pure CSS/Tailwind thin inline red progress bar indicators.
 * - Shows an empty state block when monthly records are zero.
 */
export default async function PerformanceSection() {
  const supabase = await createClient();

  // Compute current month first-day string "YYYY-MM-01"
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  // Fetch active car models
  const modelsPromise = supabase
    .from("car_models")
    .select("id, name, variant")
    .eq("is_active", true);

  // Fetch sales logged for current month
  const salesPromise = supabase
    .from("sales_entries")
    .select(`
      units_sold,
      car_model_id,
      car_models (
        name,
        variant
      )
    `)
    .eq("month", monthString);

  const [modelsRes, salesRes] = await Promise.all([
    modelsPromise,
    salesPromise,
  ]);

  const activeModels = modelsRes.data || [];
  const sales = salesRes.data || [];
  const totalSales = sales.reduce((acc, s) => acc + s.units_sold, 0);

  if (totalSales === 0) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 shadow-sm select-none font-sans">
        <h2 className="font-sans font-bold text-[14px] text-[#0A0A0A] uppercase tracking-wider mb-6">
          Sales by Model
        </h2>
        <p className="font-sans text-[13px] text-[#606060] italic">
          No sales registered for the current period.
        </p>
      </div>
    );
  }

  // Aggregate sales breakdown in-memory
  const breakdownMap: Record<
    string,
    { name: string; variant: string; units: number }
  > = {};

  // Initialize active models
  activeModels.forEach((m) => {
    breakdownMap[m.id] = {
      name: m.name,
      variant: m.variant || "",
      units: 0,
    };
  });

  // Sum units from logged entries
  sales.forEach((s) => {
    const modelId = s.car_model_id;
    const units = s.units_sold;

    if (breakdownMap[modelId]) {
      breakdownMap[modelId].units += units;
    } else if (s.car_models) {
      // Handle inactive model edge-cases having active sales safely
      const rawCarModel = s.car_models;
      const carModel = Array.isArray(rawCarModel)
        ? (rawCarModel[0] as unknown as { name: string; variant: string | null })
        : (rawCarModel as unknown as { name: string; variant: string | null });

      if (carModel) {
        breakdownMap[modelId] = {
          name: carModel.name,
          variant: carModel.variant || "",
          units: units,
        };
      }
    }
  });

  // Calculate percentage and sort
  const breakdown = Object.entries(breakdownMap)
    .map(([id, info]) => {
      const share = totalSales > 0 ? (info.units / totalSales) * 100 : 0;
      return {
        id,
        name: info.name,
        variant: info.variant,
        units_sold: info.units,
        share: share,
      };
    })
    .sort((a, b) => b.units_sold - a.units_sold);

  const maxUnitsVal = Math.max(...breakdown.map((r) => r.units_sold), 1);

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 shadow-sm select-none font-sans">
      <h2 className="font-sans font-bold text-[14px] text-[#0A0A0A] uppercase tracking-wider mb-6">
        Sales by Model
      </h2>

      <div className="space-y-5">
        {breakdown.map((row) => {
          const percentage = maxUnitsVal > 0 ? (row.units_sold / maxUnitsVal) * 100 : 0;
          return (
            <div key={row.id} className="flex items-center justify-between gap-4 text-[13px] font-sans">
              {/* Model details (left) */}
              <div className="w-[140px] sm:w-[180px] flex-shrink-0 min-w-0">
                <p className="font-bold text-[#0A0A0A] truncate">{row.name}</p>
                {row.variant && (
                  <p className="text-[#606060] text-[13px] font-normal truncate mt-0.5" title={row.variant}>
                    {row.variant}
                  </p>
                )}
              </div>

              {/* Custom horizontal progress bar indicator */}
              <div className="flex-1 h-[8px] bg-[#F4F4F4] rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-[#EB0A1E] transition-all duration-500 rounded-[2px]"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Absolute units sold count (right) */}
              <div className="w-[56px] text-right font-extrabold text-[14px] text-[#0A0A0A] flex-shrink-0">
                {row.units_sold} <span className="text-[13px] text-[#555555] font-bold uppercase tracking-wide">qty</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
