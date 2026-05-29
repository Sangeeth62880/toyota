"use client";

import { useEffect, useState } from "react";
import ToyotaLogo from "@/components/shared/ToyotaLogo";

interface WelcomeBannerProps {
  totalSales: number;
}

/**
 * Toyota Incentive Portal — Overview Dashboard Header.
 *
 * Implements a data-forward, clean automotive industrial layout:
 * - Left: Page title "Overview" (Inter 800) + dynamic current date in gray.
 * - Right: Single prominent stat showing total cars sold this month in a large red number block.
 * - Completely transparent/white background structure clearing unnecessary spacer templates.
 */
export default function WelcomeBanner({ totalSales }: WelcomeBannerProps) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 select-none font-sans">
      {/* Title & Calendar Date Column */}
      <div>
        <h1 className="text-[32px] font-extrabold text-[#0A0A0A] tracking-tight leading-none">
          Overview
        </h1>
        <p className="text-[13px] text-[#767676] font-normal mt-2">
          {formattedDate || "Loading Current Date..."}
        </p>
      </div>

      {/* Prominent High-Visibility Sales Counter Box */}
      <div className="flex items-center gap-6 bg-white border border-[#E5E5E5] rounded-[4px] px-6 py-4 shadow-sm min-w-[240px] justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-b-2 border-b-[#EB0A1E]">
        <div className="min-w-0">
          <span className="block text-[32px] font-extrabold text-[#EB0A1E] leading-none tracking-tight">
            {totalSales}
          </span>
          <span className="block text-[10px] text-[#767676] font-bold uppercase tracking-wider mt-1">
            Cars Sold This Month
          </span>
        </div>
        <ToyotaLogo size={32} color="#0A0A0A" />
      </div>
    </div>
  );
}
