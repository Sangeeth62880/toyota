"use client";

interface ToyotaLogoProps {
  /** Width and height dimensions in pixels (defaults to 48) */
  size?: number;
  /** Primary stroke color for the emblem geometry (defaults to "#EB0A1E") */
  color?: string;
  /** If true, renders the "TOYOTA" brand tag below the emblem */
  withText?: boolean;
  /** Fill color of the text block (defaults to "#0A0A0A") */
  textColor?: string;
}

/**
 * Toyota Incentive Portal — Brand Logo Component.
 *
 * Renders the official three-oval Toyota emblem:
 * - Uses exact mathematical bezier curves to lay out overlapping horizontal,
 *   vertical, and outer ovals.
 * - Scales smoothly based on sizing props.
 * - Supports rendering the capitalized "TOYOTA" type text below in Inter 700
 *   with wide character spacing (letter-spacing 0.2em) matching brand manuals.
 */
export default function ToyotaLogo({
  size = 48,
  color = "#EB0A1E",
  withText = false,
  textColor = "#0A0A0A",
}: ToyotaLogoProps) {
  return (
    <div className="inline-flex flex-col items-center gap-2 select-none">
      {/* Toyota three-oval emblem SVG vector */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-label="Toyota Emblem Logo"
      >
        {/* Outer large oval */}
        <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
        {/* Inner vertical oval */}
        <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
        {/* Inner horizontal oval */}
        <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
      </svg>

      {/* TOYOTA text block in classic font settings */}
      {withText && (
        <span
          className="font-sans font-bold text-[13px] tracking-[0.22em] uppercase leading-none select-none text-center pl-[0.22em]"
          style={{ color: textColor }}
        >
          TOYOTA
        </span>
      )}
    </div>
  );
}
