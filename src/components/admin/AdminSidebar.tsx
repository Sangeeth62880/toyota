"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Layers,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  userEmail: string;
}

/**
 * Navigation item structure for the sidebar links.
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Car Models",
    href: "/admin/cars",
    icon: Car,
  },
  {
    name: "Incentive Slabs",
    href: "/admin/slabs",
    icon: Layers,
  },
  {
    name: "Sales Officers",
    href: "/admin/officers",
    icon: Users,
  },
];

/**
 * Toyota Incentive Portal — Administrative Sidebar Component.
 *
 * Implements full brand-aligned sidebar interface:
 * - Constant 240px width structure.
 * - Deep dark surface using #0A0A0A.
 * - Header displaying the three-oval Toyota emblem in white.
 * - Navigation links utilizing Lucide icons with custom active states (Toyota Red border/tint).
 * - Full account status block on bottom with Sign Out trigger.
 * - Multi-device responsive toggle transitioning smoothly into full-viewport blur overlay on mobile.
 *
 * @param userEmail - The email address of the currently signed-in administrator
 */
export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  /**
   * Performs client-side sign out and handles smooth routing back to authentication page.
   */
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
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation Sidebar"
        aria-expanded={isOpen}
        className="fixed top-4 left-4 z-40 p-2 rounded-[4px] bg-[#0A0A0A] text-white border border-[#262626] md:hidden shadow-lg transition-colors hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#EB0A1E]"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col bg-[#0A0A0A] border-r border-[#1C1C1C] transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header Branding Panel */}
        <div className="h-[64px] px-6 border-b border-[#1C1C1C] flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[32px] h-auto flex-shrink-0"
            aria-hidden="true"
          >
            {/* Outer large oval */}
            <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
            {/* Inner vertical oval */}
            <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
            {/* Inner horizontal oval */}
            <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
          </svg>
          <span className="font-sans font-bold text-[14px] text-white tracking-wide uppercase">
            Incentive Portal
          </span>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 py-6 space-y-[4px] overflow-y-auto px-3 border-t border-[#1C1C1C]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 font-sans transition-all duration-200 border-l-2 uppercase tracking-[0.08em] text-[14px] font-bold",
                  isActive
                    ? "border-[#EB0A1E] text-white"
                    : "border-transparent text-[#9CA3AF] hover:text-white hover:bg-white/[0.02]"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Identity & Action Block */}
        <div className="p-4 border-t border-[#1C1C1C] flex flex-col gap-3">
          {/* User Email Label */}
          <div className="px-2">
            <p className="font-sans text-[13px] text-[#A0A0A0] truncate leading-none">
              Logged in as
            </p>
            <p className="font-sans font-medium text-[13px] text-white truncate mt-1.5">
              {userEmail}
            </p>
          </div>

          {/* Sign Out Trigger Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 font-sans font-semibold text-[13px] text-[#EB0A1E] hover:text-[#C5081A] bg-transparent hover:bg-white/[0.02] border border-transparent rounded-[4px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
