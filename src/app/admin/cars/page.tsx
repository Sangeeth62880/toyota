import { createClient } from "@/lib/supabase/server";
import CarModelGrid from "@/components/admin/CarModelGrid";

export default async function CarModelsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("car_models")
    .select("*")
    .order("name", { ascending: true });

  return <CarModelGrid initialCars={data || []} />;
}
