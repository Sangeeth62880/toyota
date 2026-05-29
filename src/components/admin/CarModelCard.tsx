"use client";

import { useState } from "react";
import { Car, Pencil, Power, Trash2 } from "lucide-react";
import type { CarModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/Toast";
import { useRouter } from "next/navigation";

interface CarModelCardProps {
  car: CarModel;
  onEdit: (car: CarModel) => void;
  onToggleActive: (car: CarModel) => void;
}

/**
 * Toyota Incentive Portal — Car Model Grid Card Component.
 *
 * Implements standard brand vehicle layouts:
 * - White container card with subtle borders and flat shadow lifts on mouse hovering.
 * - Top 60% space (180px): object-cover car photography, falling back to a clean
 *   gray linear gradient with a centered vector Car emblem.
 * - Bottom 40% space (120px): details padding with Inter headings, variant labels,
 *   green/gray pill badges, and a clean action deck that fades in on hover.
 *
 * @param car - The database car model configuration parameters
 * @param onEdit - Event triggering form modal edit views
 * @param onToggleActive - Event triggering optimistic active status mutations
 */
export default function CarModelCard({
  car,
  onEdit,
  onToggleActive,
}: CarModelCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDialogOpen(false);
    setIsDeleted(true);

    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        // Handle Postgres foreign key violation explicitly
        if (
          res.status === 409 ||
          (errorData?.error &&
            (errorData.error.includes("foreign key") ||
              errorData.error.includes("existing sales") ||
              errorData.error.includes("23503")))
        ) {
          showToast(
            "This model has existing sales records and cannot be deleted. You can deactivate it instead.",
            "error"
          );
        } else {
          showToast(errorData?.error || "Failed to delete the car model.", "error");
        }
        setIsDeleted(false);
        return;
      }

      showToast("Car model deleted successfully", "success");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete car model:", error);
      showToast("An unexpected error occurred while deleting.", "error");
      setIsDeleted(false);
    }
  };

  if (isDeleted) return null;

  return (
    <>
      <article className="group relative w-full h-[300px] bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 select-none">
        
        {/* Top 60%: Graphic / Photography Panel (180px) */}
        <div className="relative w-full h-[180px] bg-[#F4F4F4] overflow-hidden">
          {car.image_url && !imageError ? (
            <img
              src={car.image_url}
              alt={car.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            /* Center fallback gradient if image missing or broken */
            <div className="absolute inset-0 bg-gradient-to-br from-[#E5E5E5] to-[#F4F4F4] flex items-center justify-center">
              <Car className="w-10 h-10 text-[#767676] stroke-[1.25] transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}
        </div>

        {/* Bottom 40%: Description & Actions Panel (120px) */}
        <div className="p-4 h-[120px] flex flex-col justify-between bg-white border-t border-[#F4F4F4]">
          
          {/* Texts and Status Indicators */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-sans font-bold text-[16px] text-[#0A0A0A] leading-tight truncate max-w-[140px]"
                title={car.name}
              >
                {car.name}
              </h3>
              
              {/* Active Status Badge Pill */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none",
                  car.is_active
                    ? "bg-[#E6F4EA] text-[#137333]"
                    : "bg-[#F1F3F4] text-[#5F6368]"
                )}
              >
                {car.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p
              className="font-sans font-normal text-[13px] text-[#606060] leading-tight truncate mt-1"
              title={car.variant || ""}
            >
              {car.variant || "Standard variant"}
            </p>
          </div>

          {/* Action Row Deck (fades in smoothly on element hover) */}
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            
            {/* Edit form toggle button */}
            <button
              onClick={() => onEdit(car)}
              aria-label={`Edit ${car.name}`}
              title="Edit Model Details"
              className="p-1.5 rounded-[4px] text-[#606060] hover:text-[#0A0A0A] hover:bg-[#F4F4F4] transition-colors focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            >
              <Pencil className="w-[15px] h-[15px]" />
            </button>

            {/* Active status deactivation/activation button */}
            <button
              onClick={() => onToggleActive(car)}
              aria-label={car.is_active ? `Deactivate ${car.name}` : `Activate ${car.name}`}
              title={car.is_active ? "Deactivate Model" : "Activate Model"}
              className={cn(
                "p-1.5 rounded-[4px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]",
                car.is_active
                  ? "text-[#606060] hover:text-[#EB0A1E] hover:bg-[#EB0A1E]/5"
                  : "text-[#606060] hover:text-[#137333] hover:bg-[#E6F4EA]"
              )}
            >
              <Power className="w-[15px] h-[15px]" />
            </button>

            {/* Delete car model button */}
            <button
              onClick={() => setIsDialogOpen(true)}
              aria-label={`Delete ${car.name}`}
              title="Delete Car Model"
              className="p-1.5 rounded-[4px] text-[#606060] hover:text-[#EB0A1E] hover:bg-[#EB0A1E]/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            >
              <Trash2 className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={isDialogOpen}
        title="Delete Car Model"
        description={`This will permanently delete ${car.name}. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDialogOpen(false)}
      />
    </>
  );
}
