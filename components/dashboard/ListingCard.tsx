"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ListingStatus, PropertyType } from "@/types/database";

interface ListingCardProps {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  property_type: PropertyType | null;
  status: ListingStatus;
  intake_completed_at: string | null;
  created_at: string;
  photo_path?: string | null;
}

function formatPrice(price: number | null): string {
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPropertyType(type: PropertyType | null): string {
  if (!type) return "";
  return {
    single_family: "Single Family",
    condo: "Condo",
    townhouse: "Townhouse",
    land: "Land",
    multi_family: "Multi-Family",
  }[type];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ListingCard({
  id,
  address_line1,
  city,
  state,
  zip,
  price,
  bedrooms,
  bathrooms,
  sqft,
  property_type,
  status,
  intake_completed_at,
  created_at,
}: ListingCardProps) {
  const specs = [
    bedrooms != null && `${bedrooms} bd`,
    bathrooms != null && `${bathrooms} ba`,
    sqft != null && `${sqft.toLocaleString()} sqft`,
  ].filter(Boolean);

  return (
    <Link
      href={status === "archived" || status === "sold"
        ? `/listings/${id}/archived`
        : `/listings/${id}`}
      className="group block bg-white border border-stone/20 rounded-lg overflow-hidden hover:border-gilt/60 hover:shadow-md transition-all duration-200"
    >
      {/* Photo placeholder */}
      <div className="h-44 bg-stone/10 flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-1 text-stone/40">
          {/* Doorway icon at small size */}
          <svg width="28" height="38" viewBox="0 0 36 50" fill="none" aria-hidden>
            <rect x="0" y="4" width="36" height="6" fill="currentColor" />
            <rect x="0" y="4" width="6" height="46" fill="currentColor" />
            <rect x="30" y="4" width="6" height="46" fill="currentColor" />
          </svg>
          <span className="font-sans text-xs">No photos yet</span>
        </div>

        {/* Status badge overlaid top-right */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-sans font-medium text-ink text-sm leading-tight">
              {address_line1}
            </p>
            <p className="font-sans text-xs text-stone">
              {city}, {state} {zip}
            </p>
          </div>
          <p className="font-display text-lg text-ink leading-none flex-shrink-0">
            {formatPrice(price)}
          </p>
        </div>

        {(specs.length > 0 || property_type) && (
          <p className="font-sans text-xs text-stone">
            {[formatPropertyType(property_type), ...specs]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="pt-1 flex items-center justify-between">
          <span className="font-sans text-xs text-stone/70">
            Added {timeAgo(created_at)}
          </span>
          {intake_completed_at && (
            <span className="font-sans text-xs text-emerald-600">
              Intake received {timeAgo(intake_completed_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
