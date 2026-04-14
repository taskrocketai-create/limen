/**
 * Limen doorway logo mark.
 *
 * Shape rules (LOCKED):
 * - Two vertical posts (left + right)
 * - One horizontal lintel capping the top
 * - Posts are OPEN at the bottom — no floor, no base
 * - Never a cross shape
 *
 * Colour rules:
 * - Primary  : gilt (#C8A96E) mark on ink (#1A1814) bg
 * - Inverted : ink (#1A1814) mark on gilt (#C8A96E) bg
 * - Bare     : mark only, no background (caller controls bg)
 */

interface LogoProps {
  /** Rendered height in px. Width scales proportionally (ratio ~0.72). */
  size?: number;
  /** Colour variant. Defaults to "primary". */
  variant?: "primary" | "inverted" | "bare";
  className?: string;
  /** Accessible label. Pass "" to hide from screen readers. */
  label?: string;
}

const GILT = "#C8A96E";
const INK = "#1A1814";

// Viewbox: 36 × 50
// Mark geometry:
//   Lintel : x=0 y=0  width=36 height=6  (top horizontal stroke)
//   Left post : x=0  y=0 width=6  height=50 (open at bottom — just drawn to edge)
//   Right post: x=30 y=0 width=6  height=50
// The posts extend to the bottom of the viewbox with no closing stroke.

export default function Logo({
  size = 40,
  variant = "primary",
  className = "",
  label = "Limen",
}: LogoProps) {
  const width = Math.round(size * 0.72);
  const height = size;

  const markColor = variant === "inverted" ? INK : GILT;
  const bgColor =
    variant === "primary" ? INK : variant === "inverted" ? GILT : undefined;

  const ariaProps =
    label === ""
      ? { "aria-hidden": true as const }
      : { role: "img" as const, "aria-label": label };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...ariaProps}
    >
      {/* Background rectangle — only rendered for primary / inverted */}
      {bgColor && (
        <rect width="36" height="50" fill={bgColor} />
      )}

      {/*
        Doorway mark:
        - Lintel: full-width horizontal bar at the top
        - Left post: vertical bar, open at the bottom
        - Right post: vertical bar, open at the bottom
        All three share the same stroke color; rendered as filled rects
        so the mark scales crisply at favicon sizes.
      */}

      {/* Lintel */}
      <rect x="0" y="4" width="36" height="6" fill={markColor} />

      {/* Left post */}
      <rect x="0" y="4" width="6" height="46" fill={markColor} />

      {/* Right post */}
      <rect x="30" y="4" width="6" height="46" fill={markColor} />
    </svg>
  );
}

/**
 * Wordmark — logo mark + "Limen" text side-by-side.
 * Uses display font (Cormorant Garamond) for the name.
 */
interface WordmarkProps {
  size?: number;
  variant?: "primary" | "inverted" | "bare";
  className?: string;
}

export function Wordmark({ size = 40, variant = "primary", className = "" }: WordmarkProps) {
  const textColor =
    variant === "inverted" ? INK : variant === "primary" ? GILT : GILT;

  const containerBg =
    variant === "primary"
      ? "bg-ink"
      : variant === "inverted"
      ? "bg-gilt"
      : "";

  return (
    <div className={`inline-flex items-center gap-3 px-3 py-2 ${containerBg} ${className}`}>
      <Logo size={size} variant="bare" label="" />
      <span
        className="font-display tracking-wide select-none"
        style={{
          color: textColor,
          fontSize: Math.round(size * 0.6),
          lineHeight: 1,
          letterSpacing: "0.08em",
        }}
      >
        Limen
      </span>
    </div>
  );
}
