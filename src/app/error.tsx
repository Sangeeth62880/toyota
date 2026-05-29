"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Toyota Incentive Portal — Next.js Master Error Fallback boundary.
 *
 * Implements clean crash screens:
 * - Brand-red styled caution blocks displaying safety error messages.
 * - Standard "Try Again" trigger calling reset pipelines.
 * - Standard "Go Home" navigation button routing to dashboard roots.
 * - Output error diagnostics logged in browser consoles.
 */
export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected page crashes for cloud telemetry tracking
    console.error("System error caught by Next.js Boundary:", error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F4F4F4] px-4 font-sans select-none">
      <div className="w-full max-w-[480px] bg-white border border-[#E5E5E5] rounded-[4px] p-8 shadow-lg text-center flex flex-col items-center">
        
        {/* Circle caution alert box */}
        <div className="w-16 h-16 rounded-full bg-[#FFF8F8] flex items-center justify-center mb-5 text-[#EB0A1E] border border-[#EB0A1E]/10">
          <AlertOctagon className="w-8 h-8 stroke-[1.5]" />
        </div>

        {/* Header and warnings */}
        <h1 className="font-sans font-bold text-[22px] text-[#0A0A0A] tracking-tight leading-tight">
          System Exception Caught
        </h1>
        <p className="font-sans text-[13.5px] text-[#767676] mt-2.5 max-w-[340px] leading-relaxed">
          An unexpected error occurred while loading this portal workspace. The operation was aborted for security.
        </p>

        {/* Detailed diagnostic error panel */}
        <div className="w-full bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] p-4 my-6 text-left overflow-x-auto">
          <span className="block text-[10px] font-bold text-[#767676] uppercase tracking-wider mb-1">
            Exception Details
          </span>
          <code className="text-[12px] font-mono text-[#0A0A0A] font-semibold break-all whitespace-pre-wrap leading-tight">
            {error.message || "Unknown portal runtime error"}
          </code>
        </div>

        {/* Footer Actions Row Deck */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Back Home CTA */}
          <button
            onClick={handleGoHome}
            className="w-full sm:flex-1 h-[40px] px-4 border border-[#E0E0E0] text-[#0A0A0A] hover:bg-[#F4F4F4] text-[13px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center gap-2 focus:outline-none"
          >
            <Home className="w-4 h-4 text-[#767676]" />
            Go to Home
          </button>

          {/* Reset Boundary CTA */}
          <button
            onClick={reset}
            className="w-full sm:flex-1 h-[40px] px-4 bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4 text-white" />
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
