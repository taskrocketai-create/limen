import type { ListingStatus } from "@/types/database";

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  draft: {
    label: "Draft",
    dot: "bg-stone/40",
    text: "text-stone",
    bg: "bg-stone/10",
    border: "border-stone/20",
  },
  intake_pending: {
    label: "Intake pending",
    dot: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  intake_received: {
    label: "Intake received",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  ai_ready: {
    label: "AI ready",
    dot: "bg-gilt",
    text: "text-ink",
    bg: "bg-gilt/10",
    border: "border-gilt/30",
  },
  reviewed: {
    label: "Reviewed",
    dot: "bg-gilt",
    text: "text-ink",
    bg: "bg-gilt/20",
    border: "border-gilt/40",
  },
  submitted: {
    label: "Submitted to MLS",
    dot: "bg-ink",
    text: "text-ink",
    bg: "bg-ink/5",
    border: "border-ink/20",
  },
  sold: {
    label: "Sold",
    dot: "bg-ink",
    text: "text-ink",
    bg: "bg-ink/10",
    border: "border-ink/30",
  },
  archived: {
    label: "Archived",
    dot: "bg-stone/30",
    text: "text-stone",
    bg: "bg-stone/5",
    border: "border-stone/10",
  },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
