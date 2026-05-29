import { createClient } from "@/lib/supabase/server";
import SlabTable from "@/components/admin/SlabTable";

/**
 * Toyota Incentive Portal — Administrative Incentive Slabs Configuration Page.
 *
 * Implements the server page gateway:
 * - Checks administrator context session mapping.
 * - Queries the entire incentive_slabs table, ordered ascending by volume starting thresholds (min_units).
 * - Mounts the master interactive inline editor and visual Slab Ladder.
 */
export default async function SlabsPage() {
  const supabase = await createClient();

  // Load all current slabs from Supabase
  const { data } = await supabase
    .from("incentive_slabs")
    .select("*")
    .order("min_units", { ascending: true });

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header Explainer Text */}
      <div>
        <h1 className="font-sans font-bold text-[26px] text-[#0A0A0A] tracking-tight leading-tight">
          Incentive Slabs
        </h1>
        <p className="font-sans text-[13px] text-[#767676] mt-1">
          Define how much each Sales Officer earns per car sold based on their monthly volume.
        </p>
      </div>

      {/* Main Interactive Table Workspace */}
      <SlabTable initialSlabs={data || []} />
    </div>
  );
}
