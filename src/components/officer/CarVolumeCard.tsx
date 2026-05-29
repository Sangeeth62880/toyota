"use client";

import { useState } from "react";
import { Car, Minus, Plus } from "lucide-react";
import type { CarModel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CarVolumeCardProps {
  car: CarModel;
  units: number;
  readOnly: boolean;
  onChange: (units: number) => void;
}

/**
 * Toyota Incentive Portal — Car Volume Entry Card.
 *
 * Implements premium sales recording interfaces:
 * - Red accent left border (3px) appearing smoothly when units > 0.
 * - Responsive 16:9 vehicle graphic block with object-cover and gradient fallback.
 * - Responsive circle stepper buttons (32px) deactivating past months securely.
 * - Value highlighting (Toyota Red if > 0, standard gray if 0).
 * - Transitions set at 200ms ease.
 *
 * @param car - The vehicle model parameters
 * @param units - Current quantity logged
 * @param readOnly - Disables stepper controls for locked historical months
 * @param onChange - Emits state updates to master controller
 */
export default function CarVolumeCard({
  car,
  units,
  readOnly,
  onChange,
}: CarVolumeCardProps) {
  const [imageError, setImageError] = useState(false);
  const isLogged = units > 0;

  const handleIncrement = () => {
    if (readOnly) return;
    onChange(units + 1);
  };

  const handleDecrement = () => {
    if (readOnly) return;
    if (units <= 0) return;
    onChange(units - 1);
  };

  return (
    <article
      className={cn(
        "group relative w-full bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ease-out select-none flex flex-col justify-between min-h-[310px]",
        isLogged && "border-l-[3.5px] border-l-[#EB0A1E]"
      )}
    >
      {/* 16:9 Aspect Ratio Photography (top) */}
      <div className="relative w-full aspect-video bg-[#F4F4F4] overflow-hidden">
        {car.image_url && !imageError ? (
          <img
            src={car.image_url}
            alt={car.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Gray gradient SVG fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#333333] flex items-center justify-center">
            <Car className="w-10 h-10 text-white/40 stroke-[1.25] transition-transform duration-300 group-hover:scale-115" />
          </div>
        )}
      </div>

      {/* Texts and Stepper Area (bottom) */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {/* Name and Variant labels */}
        <div>
          <h3 className="font-sans font-bold text-[15px] text-[#0A0A0A] leading-tight truncate">
            {car.name}
          </h3>
          <p className="font-sans font-normal text-[12px] text-[#767676] truncate mt-1">
            {car.variant || "Standard variant"}
          </p>
        </div>

        {/* Stepper Grid Panel */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-6">
            
            {/* Minus Stepper Button */}
            <button
              type="button"
              onClick={handleDecrement}
              disabled={readOnly || units <= 0}
              aria-label={`Decrease logged units for ${car.name}`}
              className={cn(
                "w-8 h-8 rounded-full border-[1.5px] border-[#E0E0E0] text-[#767676] flex items-center justify-center transition-all duration-200 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed",
                !readOnly && units > 0 && "hover:border-[#EB0A1E] hover:text-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E]"
              )}
            >
              <Minus className="w-[15px] h-[15px]" />
            </button>

            {/* Current logged number display */}
            <span
              className={cn(
                "font-sans font-extrabold text-[24px] w-[36px] text-center transition-colors duration-200",
                isLogged ? "text-[#EB0A1E]" : "text-gray-300"
              )}
            >
              {units}
            </span>

            {/* Plus Stepper Button */}
            <button
              type="button"
              onClick={handleIncrement}
              disabled={readOnly}
              aria-label={`Increase logged units for ${car.name}`}
              className={cn(
                "w-8 h-8 rounded-full border-[1.5px] border-[#E0E0E0] text-[#767676] flex items-center justify-center transition-all duration-200 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed",
                !readOnly && "hover:border-[#EB0A1E] hover:text-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E]"
              )}
            >
              <Plus className="w-[15px] h-[15px]" />
            </button>
          </div>
          
          {/* Read-only historical lock indicator */}
          {readOnly && (
            <span className="text-[10px] font-sans font-bold text-[#767676] uppercase tracking-wider leading-none">
              History Locked
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
