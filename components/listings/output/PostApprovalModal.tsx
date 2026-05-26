"use client";

import { useState, useRef } from "react";
import { CardVariation, type VariationType } from "@/components/listings/output/CardVariations";
import type { BrandProfile } from "@/components/listings/output/SocialPreviews";

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface PostApprovalModalProps {
  platform: "facebook" | "instagram";
  initialCaption: string;
  photos: Photo[];
  address: string;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  brand?: BrandProfile | null;
  agentName?: string;
  agentPhone?: string;
  agentWebsite?: string;
  logoUrl?: string | null;
  selectedVariation: VariationType;
  listingId?: string;
  onClose: () => void;
  onPosted: (platform: string) => void;
}

export default function PostApprovalModal({
  platform,
  initialCaption,
  photos,
  address,
  price,
  bedrooms,
  bathrooms,
  sqft,
  brand,
  agentName,
  agentPhone,
  agentWebsite,
  logoUrl,
  selectedVariation,
  listingId,
  onClose,
  onPosted,
}: PostApprovalModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [regenerating, setRegenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const isVertical = false; // Modal always shows square/landscape preview

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/regenerate-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.caption) setCaption(data.caption);
    } catch {
      setError("Failed to regenerate. Try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePost = async () => {
    setPosting(true);
    setError("");

    // Capture card as image blob using html2canvas
    let imageDataUrl: string | null = null;
    if (cardRef.current) {
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(cardRef.current, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          backgroundColor: null,
        });
        imageDataUrl = canvas.toDataURL("image/png");
      } catch {
        console.warn("Could not capture card image, will use listing photo");
      }
    }

    try {
      const res = await fetch("/api/listings/post-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          caption,
          imageDataUrl,
          listingId,
          photoUrl: photos[0]?.url ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onPosted(platform);
        onClose();
      } else {
        setError(data.error ?? "Failed to post. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const platformLabel = platform === "facebook" ? "Facebook" : "Instagram";
  const platformColor = platform === "facebook" ? "#1877F2" : "#E1306C";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="bg-parchment rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone/20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: platformColor }} />
            <h2 className="font-serif text-xl text-ink">Review before posting to {platformLabel}</h2>
          </div>
          <button onClick={onClose} className="text-stone hover:text-ink font-sans text-lg">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Card preview */}
          <div>
            <p className="font-sans text-xs text-stone uppercase tracking-widest mb-3">Your listing card</p>
            <div ref={cardRef} className="rounded-lg overflow-hidden shadow-md" style={{ aspectRatio: "4/3", maxWidth: "360px", margin: "0 auto" }}>
              <CardVariation
                variation={selectedVariation}
                photos={photos}
                address={address}
                price={price}
                bedrooms={bedrooms}
                bathrooms={bathrooms}
                sqft={sqft}
                brand={brand}
                agentName={agentName}
                agentPhone={agentPhone}
                agentWebsite={agentWebsite}
                logoUrl={logoUrl}
                isVertical={isVertical}
              />
            </div>
          </div>

          {/* Caption editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-sans text-xs text-stone uppercase tracking-widest">Caption</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="font-sans text-xs text-gilt hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                {regenerating ? "Regenerating…" : "↺ Regenerate caption"}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
              className="w-full bg-white border border-stone/20 rounded-lg px-4 py-3 font-sans text-sm text-ink leading-relaxed focus:outline-none focus:border-gilt resize-none"
              placeholder="Your listing caption..."
            />
            <p className="font-sans text-xs text-stone/50 mt-1 text-right">{caption.length} characters</p>
          </div>

          {error && (
            <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-stone/30 text-stone font-sans text-sm py-3 rounded-lg hover:border-ink hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting || !caption.trim()}
              className="flex-1 text-white font-sans text-sm py-3 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ background: posting ? "#999" : platformColor }}
            >
              {posting ? "Posting…" : `Confirm & Post to ${platformLabel}`}
            </button>
          </div>

          <p className="font-sans text-xs text-stone/40 text-center">
            This will post immediately to your {platformLabel} {platform === "facebook" ? "Page" : "Business account"}.
          </p>
        </div>
      </div>
    </div>
  );
}
