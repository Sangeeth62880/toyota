import { createClient } from "@/lib/supabase/server";
import SlabTable from "@/components/admin/SlabTable";

export default async function SlabsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("incentive_slabs")
    .select("*")
    .order("min_units", { ascending: true });

  return (
    <div className="space-y-8 select-none font-sans">

      <div>
        <h1 className="font-sans font-bold text-[26px] text-[#0A0A0A] tracking-tight leading-tight">
          Incentive Slabs
        </h1>
        <p className="font-sans text-[13px] text-[#767676] mt-1">
          Define how much each Sales Officer earns per car sold based on their monthly volume.
        </p>
      </div>

      <SlabTable initialSlabs={data || []} />
    </div>
  );
}
