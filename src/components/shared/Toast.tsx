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

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-[360px] pointer-events-none select-none">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                "w-full bg-white border border-[#E5E5E5] rounded-[4px] p-4 shadow-xl flex gap-3.5 items-start justify-between pointer-events-auto animate-in slide-in-from-right-5 duration-300 font-sans border-l-[4px]",
                toast.type === "success" && "border-l-[#137333]",
                toast.type === "error" && "border-l-[#EB0A1E]",
                toast.type === "info" && "border-l-[#1A73E8]"
              )}
            >
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

              <p className="flex-1 text-[13px] font-sans font-medium text-[#0A0A0A] leading-normal pt-0.5">
                {toast.message}
              </p>

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

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
