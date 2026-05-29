import { createClient } from "@/lib/supabase/server";

/**
 * Pulse Loader Skeleton for Activity Feed Section.
 */
export function ActivityFeedSkeleton() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded-[4px] w-36 mb-6" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <div className="h-4 w-4 rounded-full bg-gray-200 flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-[4px] w-3/4" />
              <div className="h-3 bg-gray-200 rounded-[4px] w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Computes human-readable relative time strings since a timestamp.
 */
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "just now";
  if (diffMin === 1) return "1m ago";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs === 1) return "1h ago";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "1d ago";
  return `${diffDays}d ago`;
}

/**
 * ActivityFeedSection Component.
 *
 * Renders the last 10 logs recorded by officers in the database.
 * - Displays actions in a beautiful custom timeline format with Toyota red indicator nodes.
 * - Displays relative date stamps (e.g. "2h ago") for scanability.
 */
export default async function ActivityFeedSection() {
  const supabase = await createClient();

  // Fetch last 6 entries across all months
  const salesPromise = supabase
    .from("sales_entries")
    .select(`
      id,
      officer_id,
      car_model_id,
      units_sold,
      updated_at,
      car_models (
        name,
        variant
      )
    `)
    .gt("units_sold", 0)
    .order("updated_at", { ascending: false })
    .limit(6);

  // Fetch officer names
  const rolesPromise = supabase
    .from("user_roles")
    .select("user_id, full_name")
    .eq("role", "officer");

  const [salesRes, rolesRes] = await Promise.all([
    salesPromise,
    rolesPromise,
  ]);

  const sales = salesRes.data || [];
  const roles = rolesRes.data || [];

  const rolesMap = new Map<string, string>();
  roles.forEach((r) => {
    rolesMap.set(r.user_id, r.full_name);
  });

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-6 shadow-sm select-none font-sans h-full">
      <div>
        <h2 className="font-sans font-bold text-[14px] text-[#0A0A0A] uppercase tracking-wider mb-6">
          Recent Activity
        </h2>

        {sales.length === 0 ? (
          <div className="text-center py-12 text-[#606060] font-sans text-[13px] italic">
            No sales activity logged yet.
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {sales.map((entry, idx) => {
                const rawCarModel = entry.car_models;
                const carModel = Array.isArray(rawCarModel)
                  ? rawCarModel[0]
                  : rawCarModel;

                const officerName = rolesMap.get(entry.officer_id) || "Sales Officer";
                const modelName = carModel?.name || "Unknown Model";
                const variantName = carModel?.variant
                  ? ` (${carModel.variant})`
                  : "";
                const relativeTime = getRelativeTime(entry.updated_at);

                return (
                  <li key={entry.id}>
                    <div className="relative pb-6">
                      {/* Vertical connector line */}
                      {idx !== sales.length - 1 ? (
                        <span
                          className="absolute top-4 left-[5px] -ml-px h-full w-[1px] bg-[#E5E5E5]"
                          aria-hidden="true"
                        />
                      ) : null}

                      <div className="relative flex space-x-3 items-start">
                        {/* Timeline dot node */}
                        <div className="mt-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#EB0A1E] flex items-center justify-center ring-4 ring-white" />
                        </div>

                        {/* Main log content */}
                        <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                          <p className="text-[13px] text-[#606060] font-sans leading-snug">
                            <span className="font-bold text-[#0A0A0A] mr-1">
                              {officerName}
                            </span>
                            logged <span className="font-bold text-[#0A0A0A]">{entry.units_sold}</span> units of <span className="font-semibold text-[#0A0A0A]">{modelName}{variantName}</span>
                          </p>
                          <time className="text-[13px] font-sans font-medium text-[#606060] whitespace-nowrap text-right min-w-[54px] ml-auto">
                            {relativeTime}
                          </time>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
