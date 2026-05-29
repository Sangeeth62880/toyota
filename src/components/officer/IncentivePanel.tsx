"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2, Award, Check } from "lucide-react";
import type { IncentiveResult, IncentiveSlab, CarModel } from "@/lib/types";
import SlabLadder from "./SlabLadder";
import { getProgressToNextTier } from "@/lib/calculateIncentive";
import { cn } from "@/lib/utils";

interface IncentivePanelProps {
  result: IncentiveResult;
  slabs: IncentiveSlab[];
  carModels: CarModel[];
  isSaving: boolean;
  readOnly: boolean;
  onSave: () => Promise<void>;
}

/**
 * Toyota Incentive Portal — Live Payout Display Panel.
 *
 * Implements the live payout summary sidebar:
 * - Sticky placement alignment (`sticky top-6`) on desktop.
 * - Section 1: Dynamic "This Month's Incentive" payout amount in ₹40px, scaling 1.05x on change.
 * - Section 2: Embeds SlabLadder showing structured payout milestones.
 * - Section 3: Displays breakdowns of logged sales, itemized per vehicle.
 * - Section 4: Provides the next-tier nudge (progress bar + amber banner) dynamically.
 * - Bottom: Full width brand button (44px height) deactivating secure historical logs.
 *
 * @param result - The aggregated math payout computations
 * @param slabs - Sorted incentive slabs configuration list
 * @param carModels - Full car catalog parameters
 * @param isSaving - Triggers loading spinners on save progress
 * @param readOnly - Restricts submission button during locked months
 * @param onSave - Save event dispatcher
 */
export default function IncentivePanel({
  result,
  slabs,
  carModels,
  isSaving,
  readOnly,
  onSave,
}: IncentivePanelProps) {
  const [animate, setAnimate] = useState(false);
  const [displayPayout, setDisplayPayout] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Trigger count up and scale bounce animation on payout updates
  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 200);

    const start = 0;
    const end = result.payout;
    if (start === end) {
      setDisplayPayout(end);
      return () => clearTimeout(timeout);
    }

    const duration = 600; // ms
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      setDisplayPayout(currentValue);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      clearTimeout(timeout);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [result.payout]);

  const hasSales = result.breakdown.some((s) => s.units_sold > 0);
  const activeSlabId = result.active_slab?.id || "";

  // Progress to next tier
  const progressPercent = getProgressToNextTier(result.total_units, slabs);
  const isTopTier = result.units_to_next_tier === 0 || progressPercent === 100;

  const handleSave = async () => {
    try {
      await onSave();
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (e) {
      // Allow error to propagate naturally or let toaster handle it
    }
  };

  return (
    <aside className="sticky top-6 w-full bg-white border border-[#E5E5E5] rounded-[4px] p-7 shadow-sm select-none font-sans flex flex-col gap-6">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 1: TOTAL MONTH PAYOUT DISPLAY */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="pb-1">
        <span className="block text-[11px] font-bold text-[#767676] uppercase tracking-wider mb-1">
          This Month's Incentive
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "inline-block font-sans font-extrabold text-[40px] text-[#EB0A1E] transition-all duration-200 transform origin-left leading-none tracking-tight",
              animate ? "scale-[1.05]" : "scale-100"
            )}
          >
            ₹{displayPayout.toLocaleString()}
          </span>
        </div>
      </div>

      <hr className="border-[#E5E5E5] w-full" />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 2: VERTICAL SLAB LADDER */}
      {/* ──────────────────────────────────────────────────────────── */}
      <SlabLadder slabs={slabs} activeSlabId={activeSlabId} />

      <hr className="border-[#E5E5E5] w-full" />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 3: DETAILED VEHICLE BREAKDOWN */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="pt-1">
        <span className="block text-[11px] font-bold text-[#767676] uppercase tracking-wider mb-3">
          Sales Breakdown
        </span>

        {!hasSales ? (
          <p className="text-[13px] text-[#767676] italic text-center py-4">
            No active sales logged yet.
          </p>
        ) : (
          <div className="space-y-2 font-sans">
            {result.breakdown
              .filter((sale) => sale.units_sold > 0)
              .map((sale) => {
                const modelDetails = carModels.find((c) => c.id === sale.car_model_id);
                // Calculate rate using active slab's rate
                const carPayout = sale.units_sold * result.active_slab.incentive_per_unit;

                return (
                  <div
                    key={sale.car_model_id}
                    className="flex justify-between items-center text-[13px] text-[#0A0A0A] py-1 border-b border-[#F9F9F9]"
                  >
                    <div>
                      <span className="font-semibold">{modelDetails?.name || sale.car_name}</span>
                      <span className="text-[#767676] text-[11px] ml-1.5 font-semibold">
                        × {sale.units_sold}
                      </span>
                    </div>
                    <span className="font-bold text-[#0A0A0A]">
                      ₹{carPayout.toLocaleString()}
                    </span>
                  </div>
                );
              })}

            {/* Total Row */}
            <div className="flex justify-between items-center text-[14px] text-[#0A0A0A] font-extrabold pt-3 mt-1.5">
              <span>Total ({result.total_units} units)</span>
              <span className="text-[#EB0A1E] text-[15px]">
                ₹{displayPayout.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {((!isTopTier && result.payout > 0) || (isTopTier && result.payout > 0)) && (
        <>
          <hr className="border-[#E5E5E5] w-full" />

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 4: NEXT TIER MOTIVATIONAL NUDGE */}
          {/* ──────────────────────────────────────────────────────────── */}
          {!isTopTier && result.payout > 0 && (
            <div className="pt-1">
              {/* Amber banner card */}
              <div className="bg-[#FFFBEB] border-l-4 border-l-[#F59E0B] border-y border-r border-[#E5E5E5] rounded-[4px] p-4 text-[12.5px] text-[#7F5F00] font-medium leading-relaxed mb-3.5 flex gap-2.5 items-start">
                <AlertCircle className="w-[17px] h-[17px] text-[#B08000] flex-shrink-0 mt-0.5" strokeWidth={1} />
                <p>
                  Sell{" "}
                  <span className="font-extrabold text-[#B08000]">{result.units_to_next_tier}</span>{" "}
                  more cars to earn an extra{" "}
                  <span className="font-extrabold text-[#B08000]">
                    ₹{result.bonus_at_next_tier.toLocaleString()}
                  </span>{" "}
                  this month.
                </p>
              </div>

              {/* Thin red progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px] font-bold text-[#767676] uppercase tracking-wide">
                  <span>Tier Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-[5px] bg-[#F4F4F4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#EB0A1E] transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Already at the top tier banner */}
          {isTopTier && result.payout > 0 && (
            <div className="bg-[#E6F4EA] border border-[#A3D7B5] rounded-[4px] p-4 text-[12.5px] text-[#137333] font-medium leading-relaxed flex gap-2.5 items-start">
              <Award className="w-[17px] h-[17px] text-[#137333] flex-shrink-0 mt-0.5" strokeWidth={1} />
              <p>
                Congratulations! You are performing in the highest incentive payout tier this month.
              </p>
            </div>
          )}
        </>
      )}

      <hr className="border-[#E5E5E5] w-full" />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 5: ACTION SUBMISSION BUTTON */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="mt-1">
        <button
          onClick={handleSave}
          disabled={readOnly || isSaving}
          className="w-full h-[44px] bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13.5px] font-bold rounded-[4px] transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-[18px] h-[18px] animate-spin text-white" strokeWidth={1} />
              Saving Progress...
            </>
          ) : isSaved ? (
            <>
              <Check className="w-[18px] h-[18px] text-white" strokeWidth={1} />
              Saved!
            </>
          ) : readOnly ? (
            "Review Past Month"
          ) : (
            "Save Progress"
          )}
        </button>
      </div>
    </aside>
  );
}

