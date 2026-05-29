"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface OfficerTopNavProps {
  userFullName?: string;
}

/**
 * Toyota Incentive Portal — Officer Top Navigation Component.
 *
 * Implements fixed top-bar navigation (60px high) for sales officers:
 * - Clean white background with a bottom border separating the workspace.
 * - Left: Red Toyota emblem SVG logo + brand portal text.
 * - Center: Centered "INCENTIVE PORTAL" title.
 * - Right: Dynamic display name + initials circle from live session data + ghost LogOut button.
 * - Responsive Collapsible: Toggles menu content below the navigation bar for touch viewports.
 */
export default function OfficerTopNav({ userFullName }: OfficerTopNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{ full_name: string } | null>(
    userFullName ? { full_name: userFullName } : null
  );

  useEffect(() => {
    if (userFullName) {
      setProfile({ full_name: userFullName });
    }
  }, [userFullName]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("user_roles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching live profile in OfficerTopNav:", error);
      }
    };
    fetchProfile();
  }, [supabase]);

  const displayName = profile?.full_name || userFullName || "...";

  const initials = displayName && displayName !== "..."
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "...";

  // Populate formatted calendar date on mount to eliminate SSR hydration mismatches
  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    });
    setCurrentMonth(formatter.format(now));
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E5E5] h-[60px] select-none">
      {/* Upper main navbar flex line */}
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        
        {/* Left Side: Toyota Red Emblem & Nippon Toyota Text */}
        <Link href="/officer/dashboard" className="flex items-center gap-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EB0A1E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[28px] h-auto flex-shrink-0"
            aria-hidden="true"
          >
            {/* Outer large oval */}
            <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
            {/* Inner vertical oval */}
            <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
            {/* Inner horizontal oval */}
            <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
          </svg>
          <span className="font-sans font-bold text-[14px] text-[#EB0A1E] tracking-wider uppercase">
            NIPPON TOYOTA
          </span>
        </Link>

        {/* Center Side: "INCENTIVE PORTAL" */}
        <div className="hidden md:flex items-center justify-center font-sans font-semibold text-[15px] text-[#0A0A0A] tracking-wider">
          INCENTIVE PORTAL
        </div>

        {/* Right Side: Account Block & Desktop Sign Out */}
        <div className="flex items-center gap-4">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-sans font-semibold text-[13px] text-[#0A0A0A]">
              {displayName}
            </span>
            <div
              title={displayName}
              className="w-[36px] h-[36px] rounded-full bg-[#EB0A1E] flex items-center justify-center text-white font-sans font-semibold text-[13px] border border-[#C5081A] shadow-inner"
            >
              {initials}
            </div>
          </div>

          {/* Desktop Sign Out Icon Button */}
          <button
            onClick={handleSignOut}
            aria-label="Sign Out"
            className="hidden md:flex p-2 text-[#767676] hover:text-[#EB0A1E] transition-colors rounded-[4px] hover:bg-[#F4F4F4] focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile Hamburger Navigation Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
            className="md:hidden p-2 text-[#0A0A0A] hover:bg-[#F4F4F4] rounded-[4px] transition-colors focus:outline-none"
          >
            {isOpen ? <X className="w-[22px] h-[22px]" /> : <Menu className="w-[22px] h-[22px]" />}
          </button>
        </div>
      </div>

      {/* Expanded dropdown overlay matching mobile layout */}
      <div
        className={cn(
          "absolute top-[60px] left-0 right-0 z-30 bg-white border-b border-[#E5E5E5] px-4 py-4 md:hidden shadow-lg transition-all duration-200 ease-in-out origin-top scale-y-0 opacity-0",
          isOpen && "scale-y-100 opacity-100"
        )}
      >
        <div className="flex flex-col gap-3">
          {/* Date Indicator (Mobile) */}
          <div className="px-3 py-2 bg-[#F4F4F4] border border-[#E5E5E5] rounded-[4px] text-center font-sans font-semibold text-[13px] text-[#0A0A0A]">
            Current Period: {currentMonth || "Loading..."}
          </div>

          {/* Navigation Links */}
          <Link
            href="/officer/dashboard"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 font-sans font-medium text-[13px] rounded-[4px] transition-colors",
              pathname === "/officer/dashboard"
                ? "bg-[#EB0A1E]/10 text-[#EB0A1E]"
                : "text-[#767676] hover:text-[#0A0A0A] hover:bg-[#F4F4F4]"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview Dashboard
          </Link>

          <hr className="border-[#E5E5E5] my-1" />

          {/* Mobile Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 font-sans font-semibold text-[13px] text-[#EB0A1E] hover:text-[#C5081A] bg-[#EB0A1E]/5 hover:bg-[#EB0A1E]/10 rounded-[4px] transition-colors border border-transparent"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Account
          </button>
        </div>
      </div>
    </header>
  );
}
