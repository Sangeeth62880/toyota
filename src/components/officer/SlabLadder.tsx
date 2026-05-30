"use client";

import type { IncentiveSlab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SlabLadderProps {
  slabs: IncentiveSlab[];
  activeSlabId: string;
}

export default function SlabLadder({ slabs, activeSlabId }: SlabLadderProps) {
  return (
    <div className="flex flex-col gap-2.5 select-none font-sans">
      <span className="block text-[11px] font-bold text-[#767676] uppercase tracking-wider mb-1">
        Payout Slab Ladder
      </span>

      <div className="flex flex-col gap-2">
        {slabs.map((slab, index) => {
          const isActive = slab.id === activeSlabId;
          const isNoLimit = slab.max_units === null;

          return (
            <div
              key={slab.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-[4px] border transition-all duration-300 ease-out",
                isActive
                  ? "border-[#EB0A1E] bg-[#EB0A1E] text-white shadow-[0_4px_14px_rgba(235,10,30,0.15)] scale-[1.01]"
                  : "border-[#E5E5E5] bg-[#F9F9F9] text-[#0A0A0A]"
              )}
            >
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider leading-none",
                    isActive ? "text-white/80" : "text-[#767676]"
                  )}
                >
                  Tier {index + 1}
                </span>
                <span className="text-[13px] font-semibold mt-1">
                  {isNoLimit
                    ? `${slab.min_units}+ units`
                    : `${slab.min_units} – ${slab.max_units} units`}
                </span>
              </div>

              <span
                className={cn(
                  "text-[16px] font-extrabold tracking-tight",
                  isActive ? "text-white" : "text-[#EB0A1E]"
                )}
              >
                ₹{slab.incentive_per_unit.toLocaleString()}
                <span
                  className={cn(
                    "text-[10.5px] font-normal ml-0.5",
                    isActive ? "text-white/80" : "text-[#767676]"
                  )}
                >
                  / unit
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
