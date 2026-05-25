"use client";

import { useRef, useState } from "react";

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

function getBrandTheme(brand?: BrandProfile | null) {
  return {
    primary: brand?.primary_color ?? "#1A1814",
    secondary: brand?.secondary_color ?? "#C8A96E",
    background: brand?.background_color ?? "#1A1814",
    text: brand?.text_color ?? "#F7F5F1",
    accent: brand?.accent_color ?? "#C8A96E",
    badge: brand?.badge_text ?? "Just Listed",
    cardStyle: brand?.card_style ?? "bold_split",
  };
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
// The Marketing Card — one design, rendered at different sizes
// ---------------------------------------------------------------------------
function MarketingCard({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, platform }: MarketingCardProps) {
  const cover = photos[0];
  const theme = getBrandTheme(brand);
  const config = PLATFORM_CONFIG[platform];
  const isVertical = platform === "tiktok";
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [
    bedrooms && `${bedrooms} bd`,
    bathrooms && `${bathrooms} ba`,
    sqft && `${sqft.toLocaleString()} sf`,
  ].filter(Boolean).join("  ·  ");

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: config.aspect,
        overflow: "hidden",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: theme.primary,
      }}
    >
      {/* Full-bleed listing photo */}
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.url}
          alt="Listing"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Gradient overlay — bottom heavy */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: isVertical
          ? `linear-gradient(to top, ${theme.primary} 0%, ${theme.primary}cc 35%, transparent 65%)`
          : `linear-gradient(to top, ${theme.primary} 0%, ${theme.primary}dd 40%, ${theme.primary}88 65%, transparent 90%)`,
      }} />

      {/* Top bar — logo + badge */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: isVertical ? "20px 20px" : "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        {/* Logo or agent initials */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            crossOrigin="anonymous"
            style={{
              height: isVertical ? "36px" : "28px",
              maxWidth: "120px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
        ) : (
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: isVertical ? "15px" : "12px",
            letterSpacing: "3px",
            color: theme.accent,
            textTransform: "uppercase",
          }}>
            {agentName?.split(" ").map(w => w[0]).join("") ?? "RE"}
          </div>
        )}

        {/* Badge */}
        <div style={{
          background: theme.accent,
          color: theme.primary,
          fontSize: isVertical ? "11px" : "10px",
          fontWeight: "600",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          padding: isVertical ? "6px 14px" : "5px 12px",
        }}>
          {theme.badge}
        </div>
      </div>

      {/* Bottom content */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: isVertical ? "24px 20px" : "16px 18px",
      }}>
        {/* Price */}
        {priceStr && (
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: isVertical ? "32px" : platform === "twitter" || platform === "linkedin" ? "22px" : "26px",
            color: theme.accent,
            lineHeight: 1,
            marginBottom: "6px",
            fontWeight: "400",
          }}>
            {priceStr}
          </div>
        )}

        {/* Address */}
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: isVertical ? "22px" : platform === "twitter" || platform === "linkedin" ? "16px" : "20px",
          color: "#ffffff",
          lineHeight: 1.2,
          marginBottom: "3px",
        }}>
          {shortAddress}
        </div>

        <div style={{
          fontSize: isVertical ? "13px" : "11px",
          color: "rgba(255,255,255,0.65)",
          marginBottom: specs ? "10px" : "0",
        }}>
          {cityState}
        </div>

        {/* Specs row */}
        {specs && (
          <div style={{
            fontSize: isVertical ? "13px" : "11px",
            color: theme.accent,
            letterSpacing: "1px",
            marginBottom: "12px",
          }}>
            {specs}
          </div>
        )}

        {/* Divider */}
        <div style={{
          height: "1px",
          background: "rgba(255,255,255,0.15)",
          marginBottom: "10px",
        }} />

        {/* Agent name + powered by */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{
            fontSize: isVertical ? "12px" : "10px",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.5px",
          }}>
            {agentName ?? ""}
          </div>
          <div style={{
            fontSize: "8px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}>
            Powered by Limen
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single platform preview wrapper
// ---------------------------------------------------------------------------
function PlatformPreview(props: MarketingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const config = PLATFORM_CONFIG[props.platform];
  const filename = `${props.platform}-listing.png`;

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
      <div ref={cardRef} className="rounded-lg overflow-hidden max-w-sm mx-auto shadow-lg">
        <MarketingCard {...props} />
      </div>
      {/* Caption below card */}
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
