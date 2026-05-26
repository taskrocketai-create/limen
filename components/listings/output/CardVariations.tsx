"use client";

import { BrandProfile } from "./SocialPreviews";

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

export interface CardVariationProps {
  photos: Photo[];
  address: string;
  caption?: string;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  brand?: BrandProfile | null;
  agentName?: string;
  agentPhone?: string;
  agentWebsite?: string;
  logoUrl?: string | null;
  headshotUrl?: string | null;
  isVertical?: boolean;
}

export type VariationType = "cinematic" | "split" | "bold_header" | "postcard" | "magazine";

export const VARIATION_LABELS: Record<VariationType, string> = {
  cinematic: "Cinematic",
  split: "Split Panel",
  bold_header: "Bold Header",
  postcard: "Postcard",
  magazine: "Magazine",
};

function getBrand(brand?: BrandProfile | null) {
  return {
    primary: brand?.primary_color ?? "#0d1a0f",
    accent: brand?.accent_color ?? "#c8a96e",
    secondary: brand?.secondary_color ?? "#1e3a21",
    background: brand?.background_color ?? "#f7f5f1",
    text: brand?.text_color ?? "#1a1814",
    badge: brand?.badge_text ?? "Just Listed",
    tone: brand?.tone ?? "professional",
    typography: brand?.typography ?? "serif_dominant",
  };
}

function cacheBust(url?: string | null) {
  if (!url) return null;
  return url.includes("?") ? url : `${url}?v=${Date.now()}`;
}

function AgentStrip({ agentName, agentPhone, agentWebsite, headshotUrl, color, poweredByColor, accentColor }: {
  agentName?: string;
  agentPhone?: string;
  agentWebsite?: string;
  headshotUrl?: string | null;
  color: string;
  poweredByColor: string;
  accentColor?: string;
}) {
  const headshotSrc = cacheBust(headshotUrl);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
        {headshotSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headshotSrc} alt="Agent" crossOrigin="anonymous"
            style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1.5px solid ${accentColor ?? "rgba(255,255,255,0.3)"}` }} />
        )}
        <div style={{ fontSize: "8px", color, lineHeight: 1.5, minWidth: 0 }}>
          {agentName && <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{agentName}</div>}
          <div style={{ opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {agentPhone && <span>{agentPhone}</span>}
            {agentPhone && agentWebsite && <span style={{ margin: "0 4px" }}>·</span>}
            {agentWebsite && <span>{agentWebsite.replace(/^https?:\/\//, "")}</span>}
          </div>
        </div>
      </div>
      <div style={{ fontSize: "6px", color: poweredByColor, letterSpacing: "1px", textTransform: "uppercase", flexShrink: 0 }}>Powered by Limen</div>
    </div>
  );
}

function Logo({ logoUrl, agentName, height, filter }: { logoUrl?: string | null; agentName?: string; height: string; filter?: string }) {
  const src = cacheBust(logoUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="Logo" crossOrigin="anonymous"
        style={{ height, maxWidth: "130px", objectFit: "contain", filter: filter ?? "none" }} />
    );
  }
  return (
    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.9)", textTransform: "uppercase", fontWeight: 600 }}>
      {agentName?.split(" ").map(w => w[0]).join("") ?? "RE"}
    </div>
  );
}

// ===========================================================================
// STYLE 1 — CINEMATIC
// Full-bleed photo. Strong gradient. Centered editorial layout.
// Logo top-left. Badge top-right. All info centered.
// ===========================================================================
export function VariationCinematic({ photos, address, caption, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} BD`, bathrooms && `${bathrooms} BA`, sqft && `${sqft.toLocaleString()} SF`].filter(Boolean).join("  ·  ");
  const serif = b.typography !== "sans_dominant";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: b.primary, fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif", overflow: "hidden" }}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt="" crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }} />
      )}
      {/* Deep gradient — bottom 2/3 */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${b.primary} 0%, ${b.primary}f0 30%, ${b.primary}99 55%, transparent 80%)` }} />
      {/* Top vignette */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${b.primary}88 0%, transparent 25%)` }} />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: isVertical ? "18px 20px" : "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo logoUrl={logoUrl} agentName={agentName} height={isVertical ? "30px" : "22px"} />
        <div style={{ background: b.accent, color: b.primary, fontSize: isVertical ? "9px" : "8px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", padding: isVertical ? "5px 14px" : "4px 10px" }}>
          {b.badge}
        </div>
      </div>

      {/* Center content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px 70px", textAlign: "center" }}>
        <div style={{ width: "32px", height: "1.5px", background: b.accent, marginBottom: "14px" }} />
        {priceStr && (
          <div style={{ fontSize: isVertical ? "15px" : "11px", letterSpacing: "4px", color: b.accent, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "10px", fontWeight: 500 }}>{priceStr}</div>
        )}
        <div style={{ fontSize: isVertical ? "28px" : "22px", color: "#ffffff", lineHeight: 1.15, marginBottom: "6px", fontWeight: serif ? 400 : 600, fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif" }}>{shortAddress}</div>
        <div style={{ fontSize: isVertical ? "11px" : "9px", color: "rgba(255,255,255,0.55)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "14px" }}>{cityState}</div>
        {specs && (
          <div style={{ fontSize: isVertical ? "10px" : "9px", color: b.accent, letterSpacing: "1.5px", fontFamily: "'DM Sans', sans-serif" }}>{specs}</div>
        )}
        {caption && (
          <div style={{ marginTop: "14px", fontSize: isVertical ? "11px" : "9px", color: "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.6, maxWidth: "85%", display: "-webkit-box", WebkitLineClamp: isVertical ? 3 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {caption}
          </div>
        )}
      </div>

      {/* Bottom agent strip */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isVertical ? "14px 20px" : "10px 16px", borderTop: `1px solid rgba(255,255,255,0.08)` }}>
        <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="rgba(255,255,255,0.6)" poweredByColor="rgba(255,255,255,0.2)" accentColor={b.accent} />
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 2 — SPLIT PANEL
// Photo fills left 58%. Brand color panel right 42%. Very structured.
// ===========================================================================
export function VariationSplit({ photos, address, caption, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");
  const serif = b.typography !== "sans_dominant";

  if (isVertical) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif" }}>
        <div style={{ flex: "0 0 62%", position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover && <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="24px" />
            <div style={{ background: b.accent, color: b.primary, fontSize: "8px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
          </div>
        </div>
        <div style={{ flex: 1, background: b.primary, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: b.accent, lineHeight: 1, marginBottom: "4px" }}>{priceStr}</div>}
            <div style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>{cityState}</div>
            {caption && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</div>}
          </div>
          <div>
            {specs && <div style={{ fontSize: "8px", color: b.accent, letterSpacing: "1px", marginBottom: "8px" }}>{specs}</div>}
            <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="rgba(255,255,255,0.6)" poweredByColor="rgba(255,255,255,0.2)" accentColor={b.accent} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif" }}>
      <div style={{ flex: "0 0 58%", position: "relative", overflow: "hidden" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, transparent 65%, ${b.primary} 100%)` }} />
      </div>
      <div style={{ flex: 1, background: b.primary, padding: "16px 14px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <Logo logoUrl={logoUrl} agentName={agentName} height="20px" />
          <div style={{ width: "28px", height: "2px", background: b.accent, margin: "10px 0 8px" }} />
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 8px", display: "inline-block", marginBottom: "10px" }}>{b.badge}</div>
          {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: b.accent, lineHeight: 1, marginBottom: "5px" }}>{priceStr}</div>}
          <div style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: "#fff", lineHeight: 1.25, marginBottom: "3px" }}>{shortAddress}</div>
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>{cityState}</div>
          {caption && <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</div>}
        </div>
        <div>
          {specs && <div style={{ fontSize: "8px", color: b.accent, letterSpacing: "1px", marginBottom: "8px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>{specs}</div>}
          <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="rgba(255,255,255,0.6)" poweredByColor="rgba(255,255,255,0.2)" accentColor={b.accent} />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 3 — BOLD HEADER
// Large brand color header with price. Photo fills bottom. Footer strip.
// ===========================================================================
export function VariationBoldHeader({ photos, address, caption, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");
  const serif = b.typography !== "sans_dominant";
  const headerH = isVertical ? "32%" : "38%";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif" }}>
      <div style={{ flex: `0 0 ${headerH}`, background: b.primary, padding: isVertical ? "16px 20px" : "12px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logoUrl={logoUrl} agentName={agentName} height={isVertical ? "26px" : "20px"} />
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px" }}>{b.badge}</div>
        </div>
        <div>
          {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "30px" : "24px", color: b.accent, lineHeight: 1, marginBottom: "4px" }}>{priceStr}</div>}
          <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "18px" : "14px", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
          <div style={{ fontSize: isVertical ? "10px" : "8px", color: "rgba(255,255,255,0.45)" }}>{cityState}</div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: b.secondary }} />
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `${b.primary}ee`, padding: isVertical ? "10px 20px" : "8px 16px" }}>
          {caption && <div style={{ fontSize: isVertical ? "9px" : "8px", color: "rgba(255,255,255,0.55)", fontStyle: "italic", lineHeight: 1.5, marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "8px", color: b.accent, letterSpacing: "1px" }}>{specs}</div>
          </div>
          <div style={{ marginTop: "6px" }}>
            <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="rgba(255,255,255,0.6)" poweredByColor="rgba(255,255,255,0.2)" accentColor={b.accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 4 — POSTCARD
// White/light frame. Photo top. Clean info strip bottom. Print-ready feel.
// ===========================================================================
export function VariationPostcard({ photos, address, caption, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");
  const serif = b.typography !== "sans_dominant";
  const pad = isVertical ? "10px" : "8px";
  const stripH = isVertical ? "30%" : "34%";

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", padding: pad, display: "flex", flexDirection: "column", fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif", boxSizing: "border-box" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", marginBottom: "6px" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4dc" }} />
        )}
        <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ background: "rgba(255,255,255,0.92)", padding: "4px 8px" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="18px" filter="none" />
          </div>
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
        </div>
      </div>
      <div style={{ flex: `0 0 ${stripH}`, background: b.primary, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "16px" : "13px", color: "#ffffff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
            <div style={{ fontSize: isVertical ? "9px" : "8px", color: "rgba(255,255,255,0.5)" }}>{cityState}</div>
          </div>
          {priceStr && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "18px" : "15px", color: b.accent, lineHeight: 1, flexShrink: 0 }}>{priceStr}</div>
          )}
        </div>
        {caption && <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</div>}
        <div>
          {specs && <div style={{ fontSize: "8px", color: b.accent, letterSpacing: "1px", marginBottom: "6px" }}>{specs}</div>}
          <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="rgba(255,255,255,0.6)" poweredByColor="rgba(255,255,255,0.2)" accentColor={b.accent} />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 5 — MAGAZINE
// Photo top half. Clean white bottom. Grid specs. Agent photo prominent.
// ===========================================================================
export function VariationMagazine({ photos, address, caption, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const serif = b.typography !== "sans_dominant";
  const photoH = isVertical ? "52%" : "56%";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: serif ? "Georgia, serif" : "'DM Sans', sans-serif", background: "#ffffff" }}>
      <div style={{ flex: `0 0 ${photoH}`, position: "relative", overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4dc" }} />
        )}
        <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.93)", padding: "4px 8px" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="18px" filter="none" />
          </div>
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
        </div>
      </div>

      {/* Accent bar */}
      <div style={{ height: "3px", background: b.accent, flexShrink: 0 }} />

      <div style={{ flex: 1, background: "#ffffff", padding: isVertical ? "12px 16px" : "10px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "20px" : "15px", color: b.text, lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
          <div style={{ fontSize: isVertical ? "10px" : "8px", color: "#6B6456", marginBottom: "4px" }}>{cityState}</div>
          {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "22px" : "17px", color: b.accent, lineHeight: 1, marginBottom: "4px" }}>{priceStr}</div>}
          {caption && <div style={{ fontSize: isVertical ? "9px" : "8px", color: "#6B6456", fontStyle: "italic", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: isVertical ? 2 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</div>}
        </div>
        <div>
          <div style={{ height: "1px", background: "#e8e4dc", marginBottom: "8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              {bedrooms && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "13px" : "11px", fontWeight: "600", color: b.text }}>{bedrooms}</div><div style={{ fontSize: "6px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Beds</div></div>}
              {bathrooms && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "13px" : "11px", fontWeight: "600", color: b.text }}>{bathrooms}</div><div style={{ fontSize: "6px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Baths</div></div>}
              {sqft && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "13px" : "11px", fontWeight: "600", color: b.text }}>{sqft.toLocaleString()}</div><div style={{ fontSize: "6px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Sq Ft</div></div>}
            </div>
            <AgentStrip agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} headshotUrl={headshotUrl} color="#6B6456" poweredByColor="#bbb" accentColor={b.accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardVariation({ variation, ...props }: CardVariationProps & { variation: VariationType }) {
  switch (variation) {
    case "cinematic": return <VariationCinematic {...props} />;
    case "split": return <VariationSplit {...props} />;
    case "bold_header": return <VariationBoldHeader {...props} />;
    case "postcard": return <VariationPostcard {...props} />;
    case "magazine": return <VariationMagazine {...props} />;
    default: return <VariationCinematic {...props} />;
  }
}
