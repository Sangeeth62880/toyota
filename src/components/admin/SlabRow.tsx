"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import type { IncentiveSlab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SlabRowProps {
  slab: IncentiveSlab;
  tierIndex: number;
  isInitiallyEditing?: boolean;
  otherSlabs: IncentiveSlab[];
  onSave: (id: string, min_units: number, max_units: number | null, incentive_per_unit: number) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCancelNew?: () => void;
}

export default function SlabRow({
  slab,
  tierIndex,
  isInitiallyEditing = false,
  otherSlabs,
  onSave,
  onDelete,
  onCancelNew,
}: SlabRowProps) {
  const [isEditing, setIsEditing] = useState(isInitiallyEditing);

  const [minUnits, setMinUnits] = useState(slab.min_units);
  const [maxUnits, setMaxUnits] = useState<number | null>(slab.max_units);
  const [isNoLimit, setIsNoLimit] = useState(slab.max_units === null);
  const [incentiveRate, setIncentiveRate] = useState(slab.incentive_per_unit);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setMinUnits(slab.min_units);
    setMaxUnits(slab.max_units);
    setIsNoLimit(slab.max_units === null);
    setIncentiveRate(slab.incentive_per_unit);
    setError(null);
  }, [slab]);

  // Handle live checkbox changes deactivating max unit limits
  const handleNoLimitChange = (checked: boolean) => {
    setIsNoLimit(checked);
    if (checked) {
      setMaxUnits(null);
    } else {
      setMaxUnits((minUnits || 1) + 1);
    }
  };

  const calculateAnnualImpact = (min: number, max: number | null, rate: number): string => {
    const avgUnits = max === null ? min + 2 : (min + max) / 2;
    const annualEst = rate * avgUnits * 12;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(annualEst);
  };

  const validateSlab = (): boolean => {
    if (minUnits < 1) {
      setError("Minimum units must be at least 1.");
      return false;
    }

    if (!isNoLimit) {
      if (maxUnits === null || maxUnits === undefined) {
        setError("Maximum units is required when limit is set.");
        return false;
      }
      if (maxUnits <= minUnits) {
        setError("Maximum units must be greater than minimum units.");
        return false;
      }
    }

    if (incentiveRate <= 0) {
      setError("Incentive rate must be greater than zero.");
      return false;
    }

    // Client-side overlap validation
    const currentMax = isNoLimit ? Infinity : (maxUnits as number);
    for (const other of otherSlabs) {
      if (other.id === slab.id) continue;
      const otherMax = other.max_units === null ? Infinity : other.max_units;

      if (minUnits <= otherMax && other.min_units <= currentMax) {
        setError(
          `Overlaps with Tier [${other.min_units}–${
            other.max_units ?? "∞"
          }] (Rate: ₹${other.incentive_per_unit.toLocaleString()})`
        );
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (isPending) return;
    if (!validateSlab()) return;

    setIsPending(true);
    const success = await onSave(slab.id, minUnits, isNoLimit ? null : maxUnits, incentiveRate);
    setIsPending(false);

    if (success) {
      setIsEditing(false);
    } else {
      setError("Server validation failed. Range overlap detected.");
    }
  };

  const handleCancel = () => {
    if (onCancelNew) {
      onCancelNew();
    } else {
      setIsEditing(false);
      setMinUnits(slab.min_units);
      setMaxUnits(slab.max_units);
      setIsNoLimit(slab.max_units === null);
      setIncentiveRate(slab.incentive_per_unit);
      setError(null);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    const success = await onDelete(slab.id);
    setIsPending(false);
    if (!success) {
      setError("Cannot delete last slab tier.");
      setShowConfirmDelete(false);
    }
  };

  // Border coloring depending on Tier index
  const getTierBorderColor = (idx: number) => {
    if (idx === 1) return "border-l-4 border-l-[#137333]"; // Green
    if (idx === 2) return "border-l-4 border-l-[#B06000]"; // Amber
    return "border-l-4 border-l-[#EB0A1E]"; // Red
  };

  return (
    <>
      <tr
        className={cn(
          "text-[13px] border-b border-[#E5E5E5] transition-colors hover:bg-[#F9F9F9] h-[56px] select-none",
          getTierBorderColor(tierIndex),
          isEditing && "bg-[#FDFDFD]"
        )}
      >
        <td className="py-3 px-6 font-bold text-[#0A0A0A]">
          Tier {tierIndex}
        </td>

        <td className="py-3 px-6">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={minUnits}
                onChange={(e) => setMinUnits(parseInt(e.target.value) || 0)}
                disabled={isPending}
                className="w-[70px] h-[32px] px-2 text-[13px] border border-[#E0E0E0] rounded-[4px] bg-white text-[#0A0A0A] focus:border-[#EB0A1E] outline-none"
              />
              <span className="text-[#606060]">to</span>
              
              <input
                type="number"
                min={(minUnits || 1) + 1}
                value={maxUnits === null ? "" : maxUnits}
                onChange={(e) => setMaxUnits(parseInt(e.target.value) || null)}
                disabled={isNoLimit || isPending}
                placeholder="∞"
                className="w-[70px] h-[32px] px-2 text-[13px] border border-[#E0E0E0] rounded-[4px] bg-white text-[#0A0A0A] disabled:bg-gray-100 disabled:text-[#606060] focus:border-[#EB0A1E] outline-none"
              />

              <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNoLimit}
                  onChange={(e) => handleNoLimitChange(e.target.checked)}
                  disabled={isPending}
                  className="rounded-[4px] border-[#E0E0E0] text-[#EB0A1E] focus:ring-[#EB0A1E] cursor-pointer"
                />
                <span className="text-[13px] text-[#606060] font-medium whitespace-nowrap">No limit</span>
              </label>
            </div>
          ) : (
            <span className="font-semibold text-[#0A0A0A]">
              {slab.max_units === null ? `${slab.min_units}+` : `${slab.min_units} – ${slab.max_units}`}
              <span className="text-[13px] text-[#606060] font-normal ml-1">units</span>
            </span>
          )}
        </td>

        <td className="py-3 px-6">
          {isEditing ? (
            <div className="relative w-[130px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#606060] text-[13px]">₹</span>
              <input
                type="number"
                min="1"
                value={incentiveRate}
                onChange={(e) => setIncentiveRate(parseInt(e.target.value) || 0)}
                disabled={isPending}
                className="w-full h-[32px] pl-6 pr-2 text-[13px] font-semibold border border-[#E0E0E0] rounded-[4px] bg-white text-[#0A0A0A] focus:border-[#EB0A1E] outline-none"
              />
            </div>
          ) : (
            <span className="font-bold text-[#EB0A1E] text-[14px]">
              ₹{slab.incentive_per_unit.toLocaleString()}
              <span className="text-[13px] text-[#606060] font-normal ml-1">/ unit</span>
            </span>
          )}
        </td>

        <td className="py-3 px-6 font-medium text-[#606060]">
          {isEditing ? (
            <span className="text-[13px] italic text-[#606060]">
              {calculateAnnualImpact(minUnits, isNoLimit ? null : maxUnits, incentiveRate)} approx
            </span>
          ) : (
            <span>
              {calculateAnnualImpact(slab.min_units, slab.max_units, slab.incentive_per_unit)}
              <span className="text-[13px] font-normal text-[#606060] ml-1">approx</span>
            </span>
          )}
        </td>

        <td className="py-3 px-6 text-right">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                title="Save Tier"
                className="p-1 text-[#137333] hover:bg-[#E6F4EA] rounded-[4px] transition-colors focus:outline-none"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                title="Cancel Changes"
                className="p-1 text-[#EB0A1E] hover:bg-[#EB0A1E]/5 rounded-[4px] transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : showConfirmDelete ? (
            <div className="inline-flex items-center gap-1.5 bg-[#FFF8F8] border border-[#EB0A1E]/20 px-2 py-1 rounded-[4px]">
              <span className="text-[11px] text-[#EB0A1E] font-bold">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-1.5 py-0.5 bg-[#EB0A1E] text-white text-[11px] font-bold rounded-[2px]"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isPending}
                className="px-1.5 py-0.5 bg-gray-200 text-[#0A0A0A] text-[11px] font-bold rounded-[2px]"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setIsEditing(true)}
                title="Edit Tier"
                className="p-1.5 text-[#606060] hover:text-[#0A0A0A] hover:bg-[#F4F4F4] rounded-[4px] transition-colors focus:outline-none"
              >
                <Pencil className="w-[15px] h-[15px]" />
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                title="Delete Tier"
                className="p-1.5 text-[#606060] hover:text-[#EB0A1E] hover:bg-[#EB0A1E]/5 rounded-[4px] transition-colors focus:outline-none"
              >
                <Trash2 className="w-[15px] h-[15px]" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {error && (
        <tr className="bg-[#FFF8F8] border-b border-[#E5E5E5] select-none">
          <td colSpan={5} className="py-2.5 px-6">
            <div className="flex items-center gap-1.5 text-[#EB0A1E] font-sans">
              <AlertCircle className="w-[14px] h-[14px] flex-shrink-0" />
              <span className="text-[11.5px] font-semibold tracking-wide">{error}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
