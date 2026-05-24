"use client";

import { useRef, useState } from "react";

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface VisualCardProps {
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string | null;
  specs: string;
  photos: Photo[];
  listingUrl: string;
  tone: string;
}

async function downloadCard(ref: React.RefObject<HTMLDivElement>, filename: string) {
  if (!ref.current) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(ref.current, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: null,
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function DownloadButton({ cardRef, filename, label = "⬇ Download" }: {
  cardRef: React.RefObject<HTMLDivElement>;
  filename: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => { setLoading(true); await downloadCard(cardRef, filename); setLoading(false); }}
      className="px-3 py-1.5 bg-ink text-gilt border border-ink rounded font-sans text-xs hover:bg-gilt hover:text-ink transition-colors"
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

// Tone-based theme colors
function getToneTheme(tone: string) {
  switch (tone) {
    case "luxury_elevated": return { bg: "#111110", text: "#C8A96E", accent: "#fff", sub: "rgba(255,255,255,0.6)" };
    case "modern_minimal": return { bg: "#fff", text: "#000", accent: "#000", sub: "#666" };
    case "local_southern_charm": return { bg: "#2D5016", text: "#fff", accent: "#F5E642", sub: "rgba(255,255,255,0.8)" };
    case "investor_practical": return { bg: "#1a3a5c", text: "#fff", accent: "#4FC3F7", sub: "rgba(255,255,255,0.7)" };
    case "clean_professional": return { bg: "#1A1814", text: "#fff", accent: "#C8A96E", sub: "rgba(255,255,255,0.7)" };
    default: return { bg: "#1A1814", text: "#C8A96E", accent: "#F7F5F1", sub: "rgba(247,245,241,0.7)" }; // warm_inviting
  }
}

// ---------------------------------------------------------------------------
// Social Media Card — square with photo + overlay
// ---------------------------------------------------------------------------
export function OpenHouseSocialCard({ address, date, startTime, endTime, photos, tone }: VisualCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const theme = getToneTheme(tone);
  const shortAddress = address.split(",")[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-stone font-medium">Social media card (1:1)</p>
        <DownloadButton cardRef={cardRef} filename="open-house-social.png" />
      </div>
      <div ref={cardRef} className="relative w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-lg">
        {/* Background photo */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full" style={{ background: theme.bg }} />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />
        {/* Top badge */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span style={{ background: theme.bg, color: theme.text }} className="font-serif text-sm px-3 py-1 tracking-widest">
            OPEN HOUSE
          </span>
          <span style={{ background: theme.accent, color: theme.bg }} className="font-sans text-xs px-3 py-1 font-bold tracking-wide">
            {date}
          </span>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1">
          <p className="font-serif text-white text-xl leading-tight">{shortAddress}</p>
          <p className="font-sans text-sm" style={{ color: theme.text }}>
            {startTime} – {endTime}
          </p>
          <p className="font-sans text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            {address.split(",").slice(1).join(",").trim()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Printable Flyer Card
// ---------------------------------------------------------------------------
export function OpenHouseFlyerCard({ address, date, startTime, endTime, price, specs, photos, listingUrl, tone }: VisualCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const theme = getToneTheme(tone);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(listingUrl)}&color=1A1814&bgcolor=F7F5F1`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-stone font-medium">Printable flyer (8.5×11)</p>
        <DownloadButton cardRef={cardRef} filename="open-house-flyer.png" />
      </div>
      <div ref={cardRef} className="bg-parchment max-w-sm mx-auto rounded-lg overflow-hidden border border-stone/20" style={{ fontFamily: "Georgia, serif" }}>
        {/* Header */}
        <div className="p-4 flex justify-between items-center" style={{ background: theme.bg }}>
          <span style={{ color: theme.text, fontFamily: "Georgia, serif" }} className="text-xl tracking-widest">LIMEN</span>
          <span style={{ color: theme.text }} className="text-xs tracking-widest uppercase opacity-70">Open House</span>
        </div>
        {/* Photo */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full h-48 object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-48" style={{ background: "#E8E4DC" }} />
        )}
        {/* Date banner */}
        <div className="px-5 py-3 text-center" style={{ background: theme.bg }}>
          <p style={{ color: theme.text, fontFamily: "Georgia, serif" }} className="text-lg font-medium tracking-wide">
            {date}
          </p>
          <p style={{ color: theme.accent }} className="text-sm tracking-widest">
            {startTime} – {endTime}
          </p>
        </div>
        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p style={{ fontFamily: "Georgia, serif", color: "#1A1814" }} className="text-lg font-medium leading-snug">{address.split(",")[0]}</p>
            <p className="text-sm" style={{ color: "#6B6456" }}>{address.split(",").slice(1).join(",").trim()}</p>
          </div>
          <div className="flex gap-4 text-sm" style={{ color: "#6B6456" }}>
            {price && <span style={{ color: "#C8A96E", fontFamily: "Georgia, serif" }} className="text-base font-medium">{price}</span>}
            <span>{specs}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E8E4DC" }}>
            <div>
              <p className="text-xs" style={{ color: "#6B6456" }}>Scan to view listing</p>
              <p className="text-xs font-medium" style={{ color: "#1A1814" }}>limenai.org</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR" width={60} height={60} className="rounded" crossOrigin="anonymous" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign-In Sheet Header Card
// ---------------------------------------------------------------------------
export function OpenHouseSignInCard({ address, date, startTime, endTime, photos, tone }: VisualCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const theme = getToneTheme(tone);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-stone font-medium">Sign-in sheet header (landscape)</p>
        <DownloadButton cardRef={cardRef} filename="open-house-signin.png" />
      </div>
      <div ref={cardRef} className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg" style={{ height: "160px" }}>
        {/* Background */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full" style={{ background: theme.bg }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)" }} />
        {/* Content */}
        <div className="absolute inset-0 flex items-center px-8 gap-8">
          <div className="flex-1 space-y-1">
            <p className="font-serif text-2xl text-white leading-tight">{address.split(",")[0]}</p>
            <p className="font-sans text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{address.split(",").slice(1).join(",").trim()}</p>
          </div>
          <div className="text-right space-y-1">
            <p style={{ color: theme.text }} className="font-serif text-xl tracking-widest">OPEN HOUSE</p>
            <p className="text-white font-sans text-sm font-medium">{date}</p>
            <p className="font-sans text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{startTime} – {endTime}</p>
          </div>
        </div>
      </div>
      <p className="font-sans text-xs text-stone text-center">Print and attach below your sign-in form</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Digital Display Card — landscape for iPad/TV
// ---------------------------------------------------------------------------
export function OpenHouseDisplayCard({ address, date, startTime, endTime, price, specs, photos, listingUrl, tone }: VisualCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const theme = getToneTheme(tone);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(listingUrl)}&color=1A1814&bgcolor=F7F5F1`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-stone font-medium">Digital display (16:9 — iPad or TV)</p>
        <DownloadButton cardRef={cardRef} filename="open-house-display.png" />
      </div>
      <div ref={cardRef} className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg" style={{ aspectRatio: "16/9" }}>
        {/* Split layout */}
        <div className="absolute inset-0 flex">
          {/* Left — photo */}
          <div className="w-3/5 relative">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt="Listing" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full" style={{ background: "#E8E4DC" }} />
            )}
            {/* Gradient edge */}
            <div className="absolute inset-y-0 right-0 w-24" style={{ background: `linear-gradient(to right, transparent, ${theme.bg})` }} />
          </div>
          {/* Right — info */}
          <div className="w-2/5 flex flex-col justify-between p-6" style={{ background: theme.bg }}>
            <div>
              <p style={{ color: theme.text, fontFamily: "Georgia, serif" }} className="text-sm tracking-widest opacity-70 mb-3">OPEN HOUSE</p>
              <p style={{ color: theme.accent, fontFamily: "Georgia, serif" }} className="text-xl font-medium leading-snug mb-1">{address.split(",")[0]}</p>
              <p style={{ color: theme.sub }} className="text-xs">{address.split(",").slice(1).join(",").trim()}</p>
            </div>
            <div className="space-y-2">
              <div>
                <p style={{ color: theme.text, fontFamily: "Georgia, serif" }} className="text-base font-medium">{date}</p>
                <p style={{ color: theme.sub }} className="text-sm">{startTime} – {endTime}</p>
              </div>
              {(price || specs) && (
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.15)` }} className="pt-2 space-y-0.5">
                  {price && <p style={{ color: theme.text }} className="text-sm font-medium">{price}</p>}
                  {specs && <p style={{ color: theme.sub }} className="text-xs">{specs}</p>}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1" style={{ borderTop: `1px solid rgba(255,255,255,0.1)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR" width={48} height={48} className="rounded opacity-90" crossOrigin="anonymous" />
                <p style={{ color: theme.sub }} className="text-xs">Scan to view<br />listing details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

