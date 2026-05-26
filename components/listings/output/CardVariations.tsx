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
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  brand?: BrandProfile | null;
  agentName?: string;
  logoUrl?: string | null;
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
    primary: brand?.primary_color ?? "#1A1814",
    accent: brand?.accent_color ?? "#C8A96E",
    badge: brand?.badge_text ?? "Just Listed",
  };
}

function Logo({ logoUrl, agentName, height, filter }: { logoUrl?: string | null; agentName?: string; height: string; filter?: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="Logo" crossOrigin="anonymous"
        style={{ height, maxWidth: "120px", objectFit: "contain", filter: filter ?? "brightness(0) invert(1)" }} />
    );
  }
  return (
    <div style={{ fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>
      {agentName?.split(" ").map(w => w[0]).join("") ?? "RE"}
    </div>
  );
}

// ===========================================================================
// STYLE 1 — CINEMATIC
// Full-bleed dark photo. Large centered serif address. Minimal. Editorial.
// ===========================================================================
export function VariationCinematic({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms}`, bathrooms && `${bathrooms}`, sqft && `${sqft.toLocaleString()}`].filter(Boolean);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0a0a0a", fontFamily: "Georgia, serif", overflow: "hidden" }}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt="" crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      )}
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)" }} />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: isVertical ? "20px" : "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo logoUrl={logoUrl} agentName={agentName} height={isVertical ? "28px" : "20px"} />
        <div style={{ fontSize: "8px", letterSpacing: "3px", textTransform: "uppercase", color: b.accent, borderBottom: `1px solid ${b.accent}`, paddingBottom: "2px" }}>{b.badge}</div>
      </div>

      {/* Centered content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
        {priceStr && (
          <div style={{ fontSize: isVertical ? "13px" : "10px", letterSpacing: "4px", color: b.accent, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "12px" }}>{priceStr}</div>
        )}
        <div style={{ width: "40px", height: "1px", background: b.accent, marginBottom: "12px" }} />
        <div style={{ fontSize: isVertical ? "26px" : "20px", color: "#ffffff", lineHeight: 1.15, marginBottom: "6px", fontWeight: "400" }}>{shortAddress}</div>
        <div style={{ fontSize: isVertical ? "11px" : "9px", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", marginBottom: "14px" }}>{cityState}</div>
        {specs.length > 0 && (
          <div style={{ display: "flex", gap: "16px", fontSize: isVertical ? "11px" : "9px", color: "rgba(255,255,255,0.6)", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif" }}>
            {bedrooms && <span>{bedrooms} BD</span>}
            {bathrooms && <span>{bathrooms} BA</span>}
            {sqft && <span>{sqft.toLocaleString()} SF</span>}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px" }}>{agentName ?? ""}</div>
        <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Powered by Limen</div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 2 — SPLIT PANEL
// Photo left 60%, brand color panel right 40%. All info stacked in panel.
// ===========================================================================
export function VariationSplit({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");

  if (isVertical) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden" }}>
          {cover && <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="24px" />
            <div style={{ background: b.accent, color: b.primary, fontSize: "8px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
          </div>
        </div>
        <div style={{ flex: "0 0 40%", background: b.primary, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: b.accent, lineHeight: 1, marginBottom: "4px" }}>{priceStr}</div>}
            <div style={{ fontFamily: "Georgia, serif", fontSize: "15px", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{cityState}</div>
          </div>
          <div>
            {specs && <div style={{ fontSize: "9px", color: b.accent, letterSpacing: "1px", marginBottom: "8px" }}>{specs}</div>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>{agentName ?? ""}</div>
              <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px", textTransform: "uppercase" }}>Powered by Limen</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ flex: "0 0 60%", position: "relative", overflow: "hidden" }}>
        {cover && <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, transparent 70%, ${b.primary} 100%)` }} />
      </div>
      <div style={{ flex: "0 0 40%", background: b.primary, padding: "16px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <Logo logoUrl={logoUrl} agentName={agentName} height="20px" />
          <div style={{ width: "30px", height: "2px", background: b.accent, margin: "12px 0" }} />
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px", display: "inline-block", marginBottom: "12px" }}>{b.badge}</div>
          {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: b.accent, lineHeight: 1, marginBottom: "6px" }}>{priceStr}</div>}
          <div style={{ fontFamily: "Georgia, serif", fontSize: "14px", color: "#fff", lineHeight: 1.2, marginBottom: "3px" }}>{shortAddress}</div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)", marginBottom: "12px" }}>{cityState}</div>
          {specs && <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px", fontSize: "9px", color: b.accent, letterSpacing: "1px" }}>{specs}</div>}
        </div>
        <div>
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", marginBottom: "3px" }}>{agentName ?? ""}</div>
          <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px", textTransform: "uppercase" }}>Powered by Limen</div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 3 — BOLD HEADER
// Giant color band top with huge price type. Photo fills bottom.
// ===========================================================================
export function VariationBoldHeader({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");
  const headerH = isVertical ? "32%" : "40%";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ flex: `0 0 ${headerH}`, background: b.primary, padding: isVertical ? "18px 20px" : "12px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo logoUrl={logoUrl} agentName={agentName} height={isVertical ? "26px" : "20px"} />
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
        </div>
        <div>
          {priceStr && <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "32px" : "26px", color: b.accent, lineHeight: 1, marginBottom: "4px" }}>{priceStr}</div>}
          <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "20px" : "16px", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
          <div style={{ fontSize: isVertical ? "11px" : "9px", color: "rgba(255,255,255,0.45)" }}>{cityState}</div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#2a2a28" }} />
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `${b.primary}ee`, padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "9px", color: b.accent, letterSpacing: "1px" }}>{specs}</div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>{agentName ?? ""}</span>
            <span style={{ fontSize: "6px", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Powered by Limen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 4 — POSTCARD
// White border frame around photo. Clean bottom strip. Classic print feel.
// ===========================================================================
export function VariationPostcard({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const specs = [bedrooms && `${bedrooms} bd`, bathrooms && `${bathrooms} ba`, sqft && `${sqft.toLocaleString()} sf`].filter(Boolean).join("  ·  ");
  const pad = isVertical ? "14px" : "10px";
  const stripH = isVertical ? "28%" : "32%";

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", padding: pad, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: "border-box" }}>
      {/* Photo with border */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", marginBottom: "8px" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4dc" }} />
        )}
        {/* Top overlay */}
        <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ background: "rgba(255,255,255,0.92)", padding: "4px 10px" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="18px" filter="none" />
          </div>
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ flex: `0 0 ${stripH}`, background: b.primary, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "18px" : "14px", color: "#ffffff", lineHeight: 1.2, marginBottom: "2px" }}>{shortAddress}</div>
            <div style={{ fontSize: isVertical ? "10px" : "8px", color: "rgba(255,255,255,0.5)" }}>{cityState}</div>
          </div>
          {priceStr && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "20px" : "16px", color: b.accent, lineHeight: 1, textAlign: "right" }}>{priceStr}</div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: isVertical ? "9px" : "8px", color: b.accent, letterSpacing: "1px" }}>{specs}</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>{agentName ?? ""}</span>
            <span style={{ fontSize: "6px", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Powered by Limen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STYLE 5 — MAGAZINE
// Photo top half. Clean white bottom with large serif. Very professional.
// ===========================================================================
export function VariationMagazine({ photos, address, price, bedrooms, bathrooms, sqft, brand, agentName, logoUrl, isVertical }: CardVariationProps) {
  const cover = photos[0];
  const b = getBrand(brand);
  const shortAddress = address.split(",")[0];
  const cityState = address.split(",").slice(1, 3).join(",").trim();
  const priceStr = price ? `$${price.toLocaleString()}` : null;
  const photoH = isVertical ? "55%" : "58%";
  const infoH = isVertical ? "45%" : "42%";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif", background: "#ffffff" }}>
      {/* Photo */}
      <div style={{ flex: `0 0 ${photoH}`, position: "relative", overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#e8e4dc" }} />
        )}
        <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.92)", padding: "4px 10px" }}>
            <Logo logoUrl={logoUrl} agentName={agentName} height="18px" filter="none" />
          </div>
          <div style={{ background: b.accent, color: b.primary, fontSize: "7px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>{b.badge}</div>
        </div>
      </div>

      {/* Accent line */}
      <div style={{ height: "3px", background: b.accent, flexShrink: 0 }} />

      {/* Info panel — clean white */}
      <div style={{ flex: `0 0 ${infoH}`, background: "#ffffff", padding: isVertical ? "14px 18px" : "10px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "22px" : "16px", color: "#1A1814", lineHeight: 1.2, marginBottom: "3px" }}>{shortAddress}</div>
          <div style={{ fontSize: isVertical ? "11px" : "9px", color: "#6B6456", marginBottom: isVertical ? "10px" : "6px" }}>{cityState}</div>
          {priceStr && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: isVertical ? "26px" : "20px", color: b.accent, lineHeight: 1 }}>{priceStr}</div>
          )}
        </div>
        <div>
          <div style={{ height: "1px", background: "#e8e4dc", marginBottom: "8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "14px" }}>
              {bedrooms && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "14px" : "11px", fontWeight: "600", color: "#1A1814" }}>{bedrooms}</div><div style={{ fontSize: "7px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Beds</div></div>}
              {bathrooms && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "14px" : "11px", fontWeight: "600", color: "#1A1814" }}>{bathrooms}</div><div style={{ fontSize: "7px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Baths</div></div>}
              {sqft && <div style={{ textAlign: "center" }}><div style={{ fontSize: isVertical ? "14px" : "11px", fontWeight: "600", color: "#1A1814" }}>{sqft.toLocaleString()}</div><div style={{ fontSize: "7px", color: "#6B6456", letterSpacing: "1px", textTransform: "uppercase" }}>Sq Ft</div></div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "8px", color: "#6B6456" }}>{agentName ?? ""}</div>
              <div style={{ fontSize: "6px", color: "#bbb", letterSpacing: "1px", textTransform: "uppercase" }}>Powered by Limen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dispatcher
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
