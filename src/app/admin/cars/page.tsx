import { createClient } from "@/lib/supabase/server";
import CarModelGrid from "@/components/admin/CarModelGrid";

/**
 * Toyota Incentive Portal — Administrative Car Models Catalog Management.
 *
 * Implements the server page gateway:
 * - Initializes direct server client session mapping.
 * - Queries the entire car_models table, ordered alphabetical ascending by vehicle name.
 * - Mounts the interactive client workspace.
 */
export default async function CarModelsPage() {
  const supabase = await createClient();

  // Load all car models from PostgreSQL
  const { data } = await supabase
    .from("car_models")
    .select("*")
    .order("name", { ascending: true });

  return <CarModelGrid initialCars={data || []} />;
}
