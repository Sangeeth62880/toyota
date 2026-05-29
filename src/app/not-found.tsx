import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Toyota Incentive Portal — Next.js 404 Page Not Found.
 *
 * Implements clean, minimal Toyota brand fallbacks:
 * - Centered vertical structure.
 * - Bold "404" red brand text tags.
 * - Subtitle explaining that the page does not exist.
 * - A primary back button routing back to "/" (which automatically forwards to the appropriate dashboard via middleware).
 */
export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F4F4F4] px-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-white border border-[#E5E5E5] rounded-[4px] p-8 shadow-lg text-center flex flex-col items-center">
        
        {/* Emblem or branding header */}
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EB0A1E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[44px] h-auto"
            aria-hidden="true"
          >
            {/* Outer large oval */}
            <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
            {/* Inner vertical oval */}
            <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
            {/* Inner horizontal oval */}
            <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
          </svg>
        </div>

        {/* 404 Large Index */}
        <h1 className="font-sans font-extrabold text-[56px] text-[#EB0A1E] tracking-tighter leading-none mb-2">
          404
        </h1>

        <h2 className="font-sans font-bold text-[18px] text-[#0A0A0A] tracking-tight leading-tight">
          Page Not Found
        </h2>
        
        <p className="font-sans text-[13.5px] text-[#767676] mt-2 max-w-[280px] leading-relaxed mb-8">
          The requested page does not exist or has been relocated within this portal.
        </p>

        {/* CTA Link returning to router roots */}
        <Link
          href="/"
          className="h-[40px] px-6 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white text-[13px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 outline-none w-full"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
