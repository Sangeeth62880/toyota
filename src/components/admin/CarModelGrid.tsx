"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Car } from "lucide-react";
import type { CarModel } from "@/lib/types";
import CarModelCard from "./CarModelCard";
import CarModelFormModal from "./CarModelFormModal";

interface CarModelGridProps {
  initialCars: CarModel[];
}

/**
 * Toyota Incentive Portal — Car Models Grid & State Manager.
 *
 * Implements the interactive admin control panel:
 * - Coordinates state list for all car models.
 * - Performs optimistic UI updates (inserts, updates, active/inactive toggles)
 *   with full rollback capabilities on fetch network errors.
 * - Triggers Next.js router.refresh() to synchronize server caches after mutations.
 * - Manages modal open/close dialog flow.
 *
 * @param initialCars - Initial list of car models fetched from Server Component
 */
export default function CarModelGrid({ initialCars }: CarModelGridProps) {
  const router = useRouter();
  const [cars, setCars] = useState<CarModel[]>(initialCars);

  // Sync state if server component re-fetches or refreshes data
  useEffect(() => {
    setCars(initialCars);
  }, [initialCars]);

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);

  /**
   * Triggers Form Modal for CREATE actions.
   */
  const handleOpenAddModal = () => {
    setSelectedCar(null);
    setIsModalOpen(true);
  };

  /**
   * Triggers Form Modal for EDIT actions.
   */
  const handleOpenEditModal = (car: CarModel) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  /**
   * Mutation: Creates or Updates car model with optimistic UI representation.
   */
  const handleSaveCarModel = async (formData: {
    name: string;
    variant?: string;
    image_url?: string;
    is_active?: boolean;
  }) => {
    const previousCars = [...cars];
    const isEdit = !!selectedCar;
    const modelId = selectedCar?.id;

    // 1. Optimistic Update
    if (isEdit && modelId) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === modelId
            ? {
                ...c,
                name: formData.name,
                variant: formData.variant || "",
                image_url: formData.image_url || "",
                is_active: formData.is_active ?? c.is_active,
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
    } else {
      // Temporary ID for create optimistic placement
      const tempId = `temp-${Math.random()}`;
      const tempCar: CarModel = {
        id: tempId,
        name: formData.name,
        variant: formData.variant || "",
        image_url: formData.image_url || "",
        is_active: true, // starts active by default in table
        created_at: new Date().toISOString(),
      };
      // Place optimistic item sorted ASC by name
      setCars((prev) =>
        [...prev, tempCar].sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    // 2. Perform REST network request
    try {
      const url = isEdit ? `/api/cars/${modelId}` : "/api/cars";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Failed to save car model: ${res.statusText}`);
      }

      // 3. Clear cache and revalidate on server
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert optimistic modifications on failure
      setCars(previousCars);
      alert("Error saving car model details. Reverted layout state.");
    }
  };

  /**
   * Mutation: Toggles active / inactive status of car model with optimistic rollback.
   */
  const handleToggleActive = async (car: CarModel) => {
    const previousCars = [...cars];
    const nextActiveState = !car.is_active;

    // 1. Optimistic Update
    setCars((prev) =>
      prev.map((c) => (c.id === car.id ? { ...c, is_active: nextActiveState } : c))
    );

    // 2. Perform REST network request (PUT deactivation / activation)
    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActiveState }),
      });

      if (!res.ok) {
        throw new Error(`Failed to toggle active status: ${res.statusText}`);
      }

      // 3. Revalidate server cache
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert optimistic layout on error
      setCars(previousCars);
      alert("Error toggling car model status. Reverted layout state.");
    }
  };

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Upper header action row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-[26px] text-[#0A0A0A] tracking-tight leading-tight">
            Car Models
          </h1>
          <p className="font-sans text-[13px] text-[#767676] mt-1">
            Configure vehicle name plates, variant trims, and catalogs mapped for sales logs.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="h-[40px] px-5 bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13.5px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none"
        >
          <Plus className="w-[18px] h-[18px]" />
          Add Model
        </button>
      </div>

      {/* Grid container of car models */}
      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#E5E5E5] rounded-[4px] shadow-sm">
          <Car className="w-16 h-16 text-[#9CA3AF] mb-4 stroke-[1.25]" />
          <h3 className="text-[16px] font-bold text-[#0A0A0A]">No models found</h3>
          <p className="text-[13px] text-[#767676] mt-1 max-w-[280px]">
            Get started by adding your first active Toyota model using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {cars.map((car) => (
            <CarModelCard
              key={car.id}
              car={car}
              onEdit={handleOpenEditModal}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Reusable Form Modal */}
      <CarModelFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={selectedCar}
        onSave={handleSaveCarModel}
      />
    </div>
  );
}
