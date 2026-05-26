"use client";

import { useRef, useState } from "react";

import { CardVariation, VARIATION_LABELS, type VariationType, type CardVariationProps } from "@/components/listings/output/CardVariations";

export interface BrandProfile {
  brand_name?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  card_style?: string;
  typography?: string;
  tone?: string;
  cta_style?: string;
  headline_style?: string;
  badge_text?: string;
  tagline_style?: string;
  design_notes?: string;
}

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface MarketingCardProps {
  caption: string;
  photos: Photo[];
  address: string;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  brand?: BrandProfile | null;
  agentName?: string;
  agentPhone?: string;
  logoUrl?: string | null;
  headshotUrl?: string | null;
  platform: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin" | "nextdoor";
}


// Platform dimensions (aspect ratios for display)
const PLATFORM_CONFIG = {
  facebook: { label: "Facebook", aspect: "4/3", hint: "1200×900px — Facebook feed post" },
  instagram: { label: "Instagram", aspect: "1/1", hint: "1080×1080px — Instagram square post" },
  tiktok: { label: "TikTok / Reels", aspect: "9/16", hint: "1080×1920px — TikTok or Reels" },
  twitter: { label: "X / Twitter", aspect: "16/9", hint: "1600×900px — X/Twitter post" },
  linkedin: { label: "LinkedIn", aspect: "16/9", hint: "1200×627px — LinkedIn post" },
  nextdoor: { label: "Nextdoor", aspect: "4/3", hint: "1200×900px — Nextdoor post" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="px-3 py-1.5 border border-stone/20 rounded font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors"
    >
      {copied ? "✓ Copied" : "Copy caption"}
    </button>
  );
}

function DownloadButton({ cardRef, filename }: { cardRef: React.RefObject<HTMLDivElement>; filename: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1.5 bg-ink text-gilt border border-ink rounded font-sans text-xs hover:bg-gilt hover:text-ink transition-colors"
    >
      {loading ? "Saving…" : "⬇ Download"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Single platform preview wrapper with variation selector
// ---------------------------------------------------------------------------
function PlatformPreview(props: MarketingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [variation, setVariation] = useState<VariationType>("cinematic");
  const config = PLATFORM_CONFIG[props.platform];
  const filename = `${props.platform}-${variation}.png`;
  const isVertical = props.platform === "tiktok";

  const variationProps: CardVariationProps = {
    photos: props.photos,
    address: props.address,
    price: props.price,
    bedrooms: props.bedrooms,
    bathrooms: props.bathrooms,
    sqft: props.sqft,
    brand: props.brand,
    agentName: props.agentName,
    logoUrl: props.logoUrl,
    isVertical,
  };

  const variations = Object.entries(VARIATION_LABELS) as [VariationType, string][];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-sans text-xs font-medium text-stone">{config.label}</p>
          <p className="font-sans text-xs text-stone/50">{config.hint}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={props.caption} />
          <DownloadButton cardRef={cardRef} filename={filename} />
        </div>
      </div>

      {/* Style selector */}
      <div className="flex flex-wrap gap-2">
        {variations.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setVariation(id)}
            className={`px-3 py-1.5 font-sans text-xs rounded-md transition-colors ${
              variation === id
                ? "bg-ink text-gilt"
                : "border border-stone/20 text-stone hover:border-gilt hover:text-gilt"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="rounded-lg overflow-hidden max-w-sm mx-auto shadow-lg"
        style={{ aspectRatio: config.aspect }}
      >
        <CardVariation variation={variation} {...variationProps} />
      </div>

      {/* Caption */}
      <div className="bg-parchment rounded-md p-3 max-w-sm mx-auto">
        <p className="font-sans text-xs text-stone leading-relaxed line-clamp-4">{props.caption}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exports — one per platform
// ---------------------------------------------------------------------------
export function FacebookPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="facebook" />;
}
export function InstagramPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="instagram" />;
}
export function TikTokPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="tiktok" />;
}
export function TwitterPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="twitter" />;
}
export function LinkedInPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="linkedin" />;
}
export function NextdoorPreview(props: Omit<MarketingCardProps, "platform">) {
  return <PlatformPreview {...props} platform="nextdoor" />;
}
