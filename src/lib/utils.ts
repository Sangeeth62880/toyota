// ============================================
// Toyota Incentive Portal — Utility Functions
// ============================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using `clsx` for conditional joining and `tailwind-merge`
 * for deduplication of conflicting Tailwind utilities.
 *
 * This is the standard shadcn/ui utility — use it everywhere instead of
 * raw string concatenation to avoid class conflicts.
 *
 * @param inputs - Class values (strings, arrays, objects, conditionals)
 * @returns A single merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```ts
 * cn("px-4 py-2", isActive && "bg-toyota-red text-white", "px-6")
 * // → "py-2 bg-toyota-red text-white px-6"
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric amount as Indian Rupees (₹) using the Indian
 * numbering system (lakhs/crores grouping).
 *
 * Uses `Intl.NumberFormat` with the `en-IN` locale for proper
 * comma placement (e.g. ₹1,00,000 instead of ₹100,000).
 *
 * @param amount - The numeric amount in INR to format
 * @returns Formatted currency string (e.g. "₹1,00,000")
 *
 * @example
 * ```ts
 * formatCurrency(100000) // → "₹1,00,000"
 * formatCurrency(3500)   // → "₹3,500"
 * formatCurrency(0)      // → "₹0"
 * ```
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a `Date` object into a human-readable month–year string.
 *
 * Uses `Intl.DateTimeFormat` with `en-IN` locale for consistent output
 * across server and client rendering.
 *
 * @param date - The date to extract month and year from
 * @returns Formatted string (e.g. "June 2025")
 *
 * @example
 * ```ts
 * formatMonth(new Date("2025-06-15")) // → "June 2025"
 * formatMonth(new Date())             // → current month/year
 * ```
 */
export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}
