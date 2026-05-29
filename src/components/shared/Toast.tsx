"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toyota Incentive Portal — Custom Toast Notification Provider.
 *
 * Implements a complete toast notification pipeline:
 * - Coordinates list of active toast items in React state.
 * - Schedules automatic dismissal after exactly 4 seconds (4000ms).
 * - Mounts a fixed bottom-right Container list (`fixed bottom-4 right-4`).
 * - Provides slide-in and fade-out responsive styling:
 *   - Success: Green left border and tick icon.
 *   - Error: Toyota Red left border and caution icon.
 *   - Info: Blue left border and info banner icon.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /**
   * Safe click handler de-registering a specific toast from lists.
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Main function registering and scheduling new alerts.
   */
  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Schedule automated dismiss timer after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Alerts Container (fixed bottom-right z-50) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-[360px] pointer-events-none select-none">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                "w-full bg-white border border-[#E5E5E5] rounded-[4px] p-4 shadow-xl flex gap-3.5 items-start justify-between pointer-events-auto animate-in slide-in-from-right-5 duration-300 font-sans border-l-[4px]",
                toast.type === "success" && "border-l-[#137333]", // Success green border
                toast.type === "error" && "border-l-[#EB0A1E]",   // Error red border
                toast.type === "info" && "border-l-[#1A73E8]"     // Info blue border
              )}
            >
              {/* Type indicator icon */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-[#137333]" />
                )}
                {toast.type === "error" && (
                  <AlertTriangle className="w-5 h-5 text-[#EB0A1E]" />
                )}
                {toast.type === "info" && (
                  <Info className="w-5 h-5 text-[#1A73E8]" />
                )}
              </div>

              {/* Message label */}
              <p className="flex-1 text-[13px] font-sans font-medium text-[#0A0A0A] leading-normal pt-0.5">
                {toast.message}
              </p>

              {/* Close dismiss trigger */}
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss Notification"
                className="text-[#767676] hover:text-[#0A0A0A] rounded-[4px] hover:bg-[#F4F4F4] p-0.5 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Custom React hook accessing the Toast Notification Pipeline anywhere.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
