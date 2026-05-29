"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import type { CarModel, IncentiveSlab, SalesEntry, CarSale } from "@/lib/types";
import CarVolumeCard from "./CarVolumeCard";
import IncentivePanel from "./IncentivePanel";
import { calculateIncentive } from "@/lib/calculateIncentive";

interface SalesDashboardProps {
  cars: CarModel[];
  slabs: IncentiveSlab[];
  existingSales: SalesEntry[];
}

/**
 * Toyota Incentive Portal — Main Sales Calculator & Dashboard.
 *
 * Implements the core interactive worksheet for Sales Officers:
 * - Coordinates local state inputs for units_sold per model.
 * - Invokes client-side calculation engine synchronously on every click.
 * - Handles calendar selector (left/right navigation chevrons).
 * - Queries historical endpoints when officers switch months.
 * - Restricts editing rights to the current calendar month.
 * - Outputs bulk save POST operations.
 */
export default function SalesDashboard({
  cars,
  slabs,
  existingSales,
}: SalesDashboardProps) {
  const router = useRouter();

  // 1. Calendar Date State (initialized to first day of current calendar month)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // 2. Units Log State Map
  const [unitsMap, setUnitsMap] = useState<Map<string, number>>(() => {
    const initialMap = new Map<string, number>();
    cars.forEach((c) => initialMap.set(c.id, 0));
    existingSales.forEach((s) => initialMap.set(s.car_model_id, s.units_sold));
    return initialMap;
  });

  // 3. UI states
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Parse YYYY-MM keys
  const formatMonthKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const getMonthDisplayName = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const isPastMonth = (date: Date): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const selectedYear = date.getFullYear();
    const selectedMonth = date.getMonth();
    
    if (selectedYear < currentYear) return true;
    if (selectedYear === currentYear && selectedMonth < currentMonth) return true;
    return false;
  };

  const isFutureMonth = (date: Date): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const selectedYear = date.getFullYear();
    const selectedMonth = date.getMonth();
    
    if (selectedYear > currentYear) return true;
    if (selectedYear === currentYear && selectedMonth > currentMonth) return true;
    return false;
  };

  const readOnly = isPastMonth(selectedDate);
  const activeMonthKey = formatMonthKey(selectedDate);

  // Sync state data on month selector modifications
  useEffect(() => {
    const loadMonthlySales = async () => {
      const now = new Date();
      const currentKey = formatMonthKey(now);
      const targetKey = formatMonthKey(selectedDate);

      // Avoid fetching if it's the current month (initial props match)
      if (targetKey === currentKey) {
        const initialMap = new Map<string, number>();
        cars.forEach((c) => initialMap.set(c.id, 0));
        existingSales.forEach((s) => initialMap.set(s.car_model_id, s.units_sold));
        setUnitsMap(initialMap);
        return;
      }

      // Fetch historical logs from backend
      try {
        setIsFetching(true);
        const res = await fetch(`/api/sales?month=${targetKey}`);
        if (!res.ok) throw new Error("Failed to load historical sales entries");
        const json = await res.json();
        const historicalSales: SalesEntry[] = json.data || [];

        const newMap = new Map<string, number>();
        cars.forEach((c) => newMap.set(c.id, 0));
        historicalSales.forEach((s) => newMap.set(s.car_model_id, s.units_sold));
        setUnitsMap(newMap);
      } catch (err) {
        console.error(err);
        showToast("Failed to retrieve historical sales.", "error");
      } finally {
        setIsFetching(false);
      }
    };

    loadMonthlySales();
  }, [selectedDate, existingSales, cars]);

  /**
   * Safe toast popup handler.
   */
  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  };

  // Navigations
  const handlePrevMonth = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  /**
   * Event callback: Updates the units count for a specific car model.
   */
  const handleUnitsChange = (carModelId: string, newUnits: number) => {
    if (readOnly) return;
    setUnitsMap((prev) => {
      const next = new Map(prev);
      next.set(carModelId, newUnits);
      return next;
    });
  };

  /**
   * API Action: POST bulk upsert to save officer progress.
   */
  const handleSaveProgress = async () => {
    if (readOnly || isSaving) return;

    setIsSaving(true);

    const payloadEntries = Array.from(unitsMap.entries()).map(([car_model_id, units_sold]) => ({
      car_model_id,
      units_sold,
    }));

    try {
      const res = await fetch("/api/sales/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: activeMonthKey,
          entries: payloadEntries,
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk save request failed");
      }

      showToast("Progress saved successfully", "success");
      router.refresh();
    } catch (err) {
      console.error(err);
      showToast("Error saving dealer sales progress.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate incentive live on client
  const salesArray: CarSale[] = cars.map((car) => ({
    car_model_id: car.id,
    car_name: car.name,
    image_url: car.image_url || "",
    units_sold: unitsMap.get(car.id) || 0,
  }));

  const incentiveResult = calculateIncentive(salesArray, slabs);

  return (
    <div className="space-y-8 select-none font-sans pb-[80px] md:pb-0 pt-4">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. MASTER WORKSPACE TOAST ALERTS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-[4px] shadow-lg animate-bounce font-sans text-[13px] font-semibold text-white bg-slate-900 border border-slate-800">
          {toastMessage.type === "success" ? (
            <CheckCircle className="w-[16px] h-[16px] text-green-400" />
          ) : (
            <AlertTriangle className="w-[16px] h-[16px] text-[#EB0A1E]" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. UPPER CALENDAR MONTH NAVIGATOR PANEL */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E5E5E5] rounded-[4px] p-4 shadow-sm">
        
        {/* Left explanation texts */}
        <div>
          <h1 className="font-sans font-bold text-[20px] text-[#0A0A0A] tracking-tight leading-none">
            Incentive Calculator
          </h1>
          <p className="font-sans text-[12px] text-[#767676] mt-1.5">
            Log monthly sales volumes and watch payout figures calculate instantly.
          </p>
        </div>

        {/* Dynamic selector arrows */}
        <div className="flex items-center gap-3 bg-[#F4F4F4] border border-[#E0E0E0] rounded-[4px] p-1.5 min-w-[220px] justify-between">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="p-1 rounded-[4px] hover:bg-white text-[#767676] hover:text-[#0A0A0A] transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.25]" />
          </button>
          
          <div className="flex items-center gap-2 font-sans font-extrabold text-[13px] text-[#0A0A0A] uppercase tracking-wide">
            <Calendar className="w-[14px] h-[14px] text-[#767676]" />
            {getMonthDisplayName(selectedDate)}
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="p-1 rounded-[4px] hover:bg-white text-[#767676] hover:text-[#0A0A0A] transition-colors focus:outline-none"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.25]" />
          </button>
        </div>
      </div>

      {/* Past Historical Lock Banner */}
      {readOnly && (
        <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] p-4 flex gap-3 items-center text-[13px] text-[#767676] font-sans">
          <AlertTriangle className="w-[18px] h-[18px] text-[#767676] flex-shrink-0" strokeWidth={1.5} />
          <p>
            You are viewing historical entries for{" "}
            <span className="font-semibold text-[#0A0A0A]">
              {getMonthDisplayName(selectedDate)}
            </span>
            . Sales records for past periods are locked and cannot be updated.
          </p>
        </div>
      )}

      {/* Future Period Banner */}
      {isFutureMonth(selectedDate) && (
        <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] p-4 flex gap-3 items-center text-[13px] text-[#767676] font-sans">
          <Calendar className="w-[18px] h-[18px] text-[#767676] flex-shrink-0" strokeWidth={1.5} />
          <p>
            You are viewing a future period —{" "}
            <span className="font-semibold text-[#0A0A0A]">
              {getMonthDisplayName(selectedDate)}
            </span>
            . You can pre-log expected sales. These will be saved and editable until the month begins.
          </p>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. CORE SPLIT GRID LAYOUT */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left canvas: Interactive Car Steppers Grid (65% on desktop) */}
        <section className="lg:col-span-8 w-full min-w-0">
          {isFetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-[#E5E5E5] rounded-[4px] h-[310px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cars.map((car) => (
                <CarVolumeCard
                  key={car.id}
                  car={car}
                  units={unitsMap.get(car.id) || 0}
                  readOnly={readOnly}
                  onChange={(units) => handleUnitsChange(car.id, units)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right canvas: Sticky Live Incentive Panel (35% on desktop) */}
        <section className="lg:col-span-4 w-full min-w-0">
          <IncentivePanel
            result={incentiveResult}
            slabs={slabs}
            carModels={cars}
            isSaving={isSaving}
            readOnly={readOnly}
            onSave={handleSaveProgress}
          />
        </section>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. MOBILE-ONLY BOTTOM FIXED PANEL BAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E5E5] px-5 py-3.5 flex items-center justify-between md:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#767676] font-bold uppercase tracking-wider leading-none">
            Estimated Incentive
          </span>
          <span className="text-[19px] font-extrabold text-[#EB0A1E] leading-none mt-1">
            ₹{incentiveResult.payout.toLocaleString()}
          </span>
        </div>
        
        <button
          onClick={handleSaveProgress}
          disabled={readOnly || isSaving}
          className="h-[38px] px-5 bg-[#EB0A1E] text-white text-[12.5px] font-bold rounded-none flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

    </div>
  );
}
