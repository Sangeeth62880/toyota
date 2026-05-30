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

export default function CarModelGrid({ initialCars }: CarModelGridProps) {
  const router = useRouter();
  const [cars, setCars] = useState<CarModel[]>(initialCars);

  useEffect(() => {
    setCars(initialCars);
  }, [initialCars]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarModel | null>(null);

  const handleOpenAddModal = () => {
    setSelectedCar(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (car: CarModel) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleSaveCarModel = async (formData: {
    name: string;
    variant?: string;
    image_url?: string;
    is_active?: boolean;
  }) => {
    const previousCars = [...cars];
    const isEdit = !!selectedCar;
    const modelId = selectedCar?.id;

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

      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert optimistic modifications on failure
      setCars(previousCars);
      alert("Error saving car model details. Reverted layout state.");
    }
  };

  const handleToggleActive = async (car: CarModel) => {
    const previousCars = [...cars];
    const nextActiveState = !car.is_active;

    setCars((prev) =>
      prev.map((c) => (c.id === car.id ? { ...c, is_active: nextActiveState } : c))
    );

    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActiveState }),
      });

      if (!res.ok) {
        throw new Error(`Failed to toggle active status: ${res.statusText}`);
      }

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

      <CarModelFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={selectedCar}
        onSave={handleSaveCarModel}
      />
    </div>
  );
}
