"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Layers } from "lucide-react";
import type { IncentiveSlab } from "@/lib/types";
import SlabRow from "./SlabRow";
import { cn } from "@/lib/utils";

interface SlabTableProps {
  initialSlabs: IncentiveSlab[];
}

/**
 * SlabTable Component.
 *
 * Implements the master configuration workspace:
 * - Displays a live visual "Slab Ladder" horizontal stepped diagram.
 * - Highlights the highest reward tier (most generous) dynamically.
 * - Houses the custom styled tables listing tiers, ranges, rates, and annual impact values.
 * - Includes a quick-add "Add Tier" trigger button appending editable rows inline.
 * - Coordinates POST/PUT/DELETE API endpoints for database sync.
 *
 * @param initialSlabs - List of slabs loaded on the server
 */
export default function SlabTable({ initialSlabs }: SlabTableProps) {
  const router = useRouter();
  const [slabs, setSlabs] = useState<IncentiveSlab[]>(initialSlabs);
  const [newSlab, setNewSlab] = useState<IncentiveSlab | null>(null);

  // Sync with server-side page caches
  useEffect(() => {
    setSlabs(initialSlabs);
  }, [initialSlabs]);

  // Find most generous reward rate to highlight the active tier in red
  const maxIncentiveRate =
    slabs.length > 0 ? Math.max(...slabs.map((s) => s.incentive_per_unit)) : 0;

  /**
   * Action: Adds an empty, pre-editing tier row at the bottom of the grid.
   */
  const handleAddTierClick = () => {
    if (newSlab) return;

    // Calculate default min_units based on highest existing max units
    let nextMinUnits = 1;
    if (slabs.length > 0) {
      const highestSlab = slabs[slabs.length - 1];
      nextMinUnits =
        highestSlab.max_units === null
          ? highestSlab.min_units + 4
          : highestSlab.max_units + 1;
    }

    const tempNewSlab: IncentiveSlab = {
      id: `new-${Math.random()}`,
      min_units: nextMinUnits,
      max_units: null,
      incentive_per_unit: 1000,
      updated_at: new Date().toISOString(),
    };

    setNewSlab(tempNewSlab);
  };

  /**
   * API Action: POST new slab tier to backend.
   */
  const handleCreateSlab = async (
    _id: string,
    min: number,
    max: number | null,
    rate: number
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_units: min,
          max_units: max,
          incentive_per_unit: rate,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save newly created slab");
      }

      const json = await res.json();
      const createdSlab = json.data;

      // Update state and clear temporary rows
      setSlabs((prev) =>
        [...prev, createdSlab].sort((a, b) => a.min_units - b.min_units)
      );
      setNewSlab(null);

      // Revalidate cache
      router.refresh();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * API Action: PUT existing slab updates to backend.
   */
  const handleUpdateSlab = async (
    id: string,
    min: number,
    max: number | null,
    rate: number
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/slabs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_units: min,
          max_units: max,
          incentive_per_unit: rate,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update slab");
      }

      const json = await res.json();
      const updatedSlab = json.data;

      // Update state
      setSlabs((prev) =>
        prev
          .map((s) => (s.id === id ? updatedSlab : s))
          .sort((a, b) => a.min_units - b.min_units)
      );

      // Revalidate cache
      router.refresh();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * API Action: DELETE slab from database.
   */
  const handleDeleteSlab = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/slabs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete slab");
      }

      // Remove from local states
      setSlabs((prev) => prev.filter((s) => s.id !== id));

      // Revalidate cache
      router.refresh();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <div className="space-y-8 select-none font-sans">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. VISUAL STEPPED SLAB LADDER */}
      {/* ──────────────────────────────────────────────────────────── */}
      {slabs.length > 0 && (
        <div className="space-y-3">
          <span className="block text-[14px] font-bold text-[#555555] uppercase tracking-wider">
            Slab Ladder View
          </span>
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 w-full">
            {slabs.map((slab, index) => {
              const isMax = slab.incentive_per_unit === maxIncentiveRate;
              const isLast = index === slabs.length - 1;

              return (
                <div key={slab.id} className="flex-1 flex items-center w-full">
                  {/* Stepped block box */}
                  <div
                    className={cn(
                      "flex-1 p-5 rounded-[4px] flex flex-col justify-center min-h-[110px] transition-all bg-white",
                      isMax
                        ? "border-[1.5px] border-[#0A0A0A] shadow-md"
                        : "border border-[#E5E5E5] shadow-sm"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[14px] font-bold uppercase tracking-wider leading-none",
                        isMax ? "text-[#0A0A0A]" : "text-[#555555]"
                      )}
                    >
                      Tier {index + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-[#0A0A0A] mt-2">
                      {slab.max_units === null
                        ? `${slab.min_units}+ units`
                        : `${slab.min_units} – ${slab.max_units} units`}
                    </span>
                    <span
                      className={cn(
                        "text-[22px] font-extrabold tracking-tight leading-none mt-1.5",
                        isMax ? "text-[#EB0A1E]" : "text-[#0A0A0A]"
                      )}
                    >
                      ₹{slab.incentive_per_unit.toLocaleString()}
                      <span className="text-[13px] font-normal text-[#606060] ml-1">
                        / unit
                      </span>
                    </span>
                  </div>

                  {/* Connecting Chevrons */}
                  {!isLast && (
                    <div className="hidden md:flex items-center justify-center px-2">
                      <ChevronRight className="w-5 h-5 text-[#9CA3AF] stroke-[2]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. INLINE SLAB TABLE EDITOR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden shadow-sm">
        {slabs.length === 0 && !newSlab ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="w-16 h-16 text-[#9CA3AF] mb-4 stroke-[1.25]" />
            <h3 className="text-[16px] font-bold text-[#0A0A0A]">No slab tiers found</h3>
            <p className="text-[13px] text-[#606060] mt-1 max-w-[280px]">
              Set up your dealer payout slabs to start calculating monthly bonuses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FDFDFD] text-[13px] font-bold text-[#555555] uppercase tracking-wider h-[44px]">
                  <th className="py-2 px-6 font-semibold w-[120px]">Tier</th>
                  <th className="py-2 px-6 font-semibold">Volume Range</th>
                  <th className="py-2 px-6 font-semibold w-[180px]">Per Car rate</th>
                  <th className="py-2 px-6 font-semibold w-[200px]">Annual Impact*</th>
                  <th className="py-2 px-6 font-semibold text-right w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {/* Existing database slabs */}
                {slabs.map((slab, idx) => (
                  <SlabRow
                    key={slab.id}
                    slab={slab}
                    tierIndex={idx + 1}
                    otherSlabs={slabs}
                    onSave={handleUpdateSlab}
                    onDelete={handleDeleteSlab}
                  />
                ))}

                {/* Inline newly created slab */}
                {newSlab && (
                  <SlabRow
                    slab={newSlab}
                    tierIndex={slabs.length + 1}
                    isInitiallyEditing={true}
                    otherSlabs={slabs}
                    onSave={handleCreateSlab}
                    onDelete={async () => true}
                    onCancelNew={() => setNewSlab(null)}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. WORKSPACE FOOTER ACTIONS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-[13px] text-[#606060] leading-snug italic max-w-[460px]">
          * Annual Impact is an estimation based on the mathematical average of the volume limits
          multiplied across a full 12-month calendar period. For unbounded tiers, a local baseline increment is assumed.
        </p>

        <button
          onClick={handleAddTierClick}
          disabled={!!newSlab}
          className="h-[40px] px-5 bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13.5px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Plus className="w-[18px] h-[18px]" />
          Add Tier Range
        </button>
      </div>
    </div>
  );
}
