"use client";

import { useState } from "react";
import {
  FacebookPreview,
  InstagramPreview,
  TikTokPreview,
  TwitterPreview,
  LinkedInPreview,
  NextdoorPreview,
  type BrandProfile,
} from "@/components/listings/output/SocialPreviews";
import PostApprovalModal from "@/components/listings/output/PostApprovalModal";
import FacebookPostPreviewModal from "@/components/listings/output/FacebookPostPreviewModal";

interface MlsContent {
  description: string;
  agent_remarks: string;
  highlights: string[];
}

interface ZillowContent {
  description: string;
  highlights: string[];
  what_i_love: string;
}

interface RealtorComContent {
  description: string;
  highlights: string[];
}

interface GoogleContent {
  post: string;
}

interface SocialCaptions {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  nextdoor?: string;
}

interface PlatformContent {
  mls?: MlsContent;
  zillow?: ZillowContent;
  realtor_com?: RealtorComContent;
  google?: GoogleContent;
}

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface PlatformPanelProps {
  social_captions: SocialCaptions | null;
  platform_content: PlatformContent | null;
  photos: Photo[];
  address: string;
  listingId?: string;
  isLocked?: boolean;
  isPublishPlan?: boolean;
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
  aiImageUrl?: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="px-3 py-1.5 border border-stone/20 rounded font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors flex-shrink-0"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function CharCount({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  const over = count > limit;
  return (
    <span className={`font-sans text-xs ${over ? "text-red-500" : "text-stone/50"}`}>
      {count.toLocaleString()} / {limit.toLocaleString()} chars{over ? " — over limit" : ""}
    </span>
  );
}

function FieldBlock({ label, text, limit, note }: { label: string; text: string; limit?: number; note?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">{label}</p>
          {note && <p className="font-sans text-xs text-stone/50 mt-0.5">{note}</p>}
        </div>
        <div className="flex items-center gap-2">
          {limit && <CharCount text={text} limit={limit} />}
          <CopyButton text={text} />
        </div>
      </div>
      <div className="bg-parchment rounded-md p-3">
        <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  const text = items.map(i => `• ${i}`).join("\n");
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">{label}</p>
        <CopyButton text={text} />
      </div>
      <div className="bg-parchment rounded-md p-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-gilt mt-0.5 flex-shrink-0">•</span>
            <p className="font-sans text-sm text-ink">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type PlatformId = "mls" | "zillow" | "realtor_com" | "facebook" | "instagram" | "tiktok" | "linkedin" | "nextdoor" | "google" | "twitter";

const PLATFORMS: { id: PlatformId; label: string; shortLabel: string }[] = [
  { id: "mls", label: "MLS", shortLabel: "MLS" },
  { id: "zillow", label: "Zillow", shortLabel: "Z" },
  { id: "realtor_com", label: "Realtor.com", shortLabel: "R" },
  { id: "facebook", label: "Facebook", shortLabel: "f" },
  { id: "instagram", label: "Instagram", shortLabel: "IG" },
  { id: "tiktok", label: "TikTok", shortLabel: "TT" },
  { id: "linkedin", label: "LinkedIn", shortLabel: "in" },
  { id: "nextdoor", label: "Nextdoor", shortLabel: "ND" },
  { id: "google", label: "Google", shortLabel: "G" },
  { id: "twitter", label: "X / Twitter", shortLabel: "X" },
];

function PlatformGlyph({ id, shortLabel }: { id: PlatformId; shortLabel: string }) {
  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7h2.35l.35-2.7H13.5V9.57c0-.78.22-1.31 1.34-1.31h1.43V5.84a18.8 18.8 0 0 0-2.08-.11c-2.06 0-3.47 1.25-3.47 3.56v2h-2.33V14h2.33v7h2.78z" />
      </svg>
    );
  }

  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return <span className="text-[11px] font-semibold tracking-wide">{shortLabel}</span>;
}

function PhotoStrip({ photos, max = 5, label }: { photos: Photo[]; max?: number; label: string }) {
  const shown = photos.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shown.map((photo, i) => (
          <div key={photo.id} className="relative flex-shrink-0 w-32 h-24 rounded-md overflow-hidden bg-parchment border border-stone/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 px-1 py-0.5 bg-ink/70 text-gilt font-sans text-[9px] rounded">Cover</span>
            )}
          </div>
        ))}
        {photos.length > max && (
          <div className="flex-shrink-0 w-32 h-24 rounded-md bg-parchment border border-stone/10 flex items-center justify-center">
            <span className="font-sans text-sm text-stone">+{photos.length - max} more</span>
          </div>
        )}
      </div>
      <p className="font-sans text-xs text-stone/50">Attach these photos when posting</p>
    </div>
  );
}

export default function PlatformPanel({ social_captions, platform_content, photos, address, listingId, isLocked, isPublishPlan, price, bedrooms, bathrooms, sqft, brand, agentName, agentPhone, agentWebsite, logoUrl, headshotUrl }: PlatformPanelProps) {
  const [active, setActive] = useState<PlatformId | null>(null);
  const [captions, setCaptions] = useState<Partial<Record<string, string>>>({});
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [postedPlatforms, setPostedPlatforms] = useState<Set<string>>(new Set());
  const [instagramModal, setInstagramModal] = useState<{ caption: string } | null>(null);
  const [facebookModalOpen, setFacebookModalOpen] = useState(false);
  const [facebookCaption, setFacebookCaption] = useState("");
  const [facebookPredictionId, setFacebookPredictionId] = useState<string | null>(null);
  const [facebookPending, setFacebookPending] = useState(false);
  const [facebookModalError, setFacebookModalError] = useState<string | null>(null);

  const getCaption = (platform: string): string => {
    return captions[platform] ?? (social_captions as Record<string, string>)?.[platform] ?? "";
  };

  const [regenError, setRegenError] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  const handleRegenerate = async (platform: string) => {
    if (!listingId) { setRegenError("Listing ID missing."); return; }
    if (platform === "facebook") {
      await launchFacebookComposer();
      return;
    }
    setRegenerating(platform);
    setRegenError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/regenerate-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.error) {
        setRegenError(data.error);
      } else {
        if (data.caption) setCaptions(prev => ({ ...prev, [platform]: data.caption }));
      }
    } catch {
      setRegenError("Network error. Please try again.");
    } finally {
      setRegenerating(null);
    }
  };

  const RegenButtons = ({ platform }: { platform: string }) => (
    <div className="space-y-2">
      <button
        onClick={() => handleRegenerate(platform)}
        disabled={regenerating === platform}
        className="flex items-center gap-2 px-4 py-2 bg-ink text-gilt rounded font-sans text-xs font-medium hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
      >
        {regenerating === platform
          ? <><span className="animate-spin inline-block">✦</span> Generating…</>
          : <>✦ Regenerate</>}
      </button>
      {regenError && <p className="font-sans text-xs text-red-500">{regenError}</p>}
    </div>
  );

  async function launchFacebookComposer() {
    if (!listingId) {
      setFacebookModalError("Listing ID missing.");
      return;
    }

    setFacebookModalOpen(true);
    setFacebookPending(true);
    setFacebookModalError(null);
    setFacebookCaption(getCaption("facebook"));
    setFacebookPredictionId(null);

    try {
      const response = await fetch(`/api/listings/${listingId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate Facebook post preview.");
      }

      setFacebookCaption(data.caption || "");
      setCaptions((prev) => ({ ...prev, facebook: data.caption || "" }));
      setFacebookPredictionId(data.predictionId || null);
      setAiImageUrl(null);
    } catch (error) {
      setFacebookModalError(error instanceof Error ? error.message : "Failed to generate Facebook post preview.");
    } finally {
      setFacebookPending(false);
    }
  }

  const hasContent = (id: PlatformId) => {
    if (id === "mls") return !!platform_content?.mls;
    if (id === "zillow") return !!platform_content?.zillow;
    if (id === "realtor_com") return !!platform_content?.realtor_com;
    if (id === "google") return !!platform_content?.google;
    if (id === "facebook") return !!social_captions?.facebook;
    if (id === "instagram") return !!social_captions?.instagram;
    if (id === "tiktok") return !!social_captions?.tiktok;
    if (id === "linkedin") return !!social_captions?.linkedin;
    if (id === "nextdoor") return !!social_captions?.nextdoor;
    if (id === "twitter") return !!social_captions?.twitter;
    return false;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-ink">Publish to platforms</h3>

      {/* Platform selector */}
      <div className="rounded-2xl bg-[#1A1814] border border-[#C8A96E]/30 p-4 sm:p-5">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#C8A96E] mb-3">Select platform</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PLATFORMS.map((p) => {
          const ready = hasContent(p.id);
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === "facebook" && ready && isLocked && isPublishPlan) {
                  void launchFacebookComposer();
                  setActive("facebook");
                  return;
                }
                setActive(isActive ? null : p.id);
              }}
              disabled={!ready}
              className={`group rounded-xl border px-3 py-3 text-left transition-all font-sans ${
                isActive
                  ? "border-[#C8A96E] bg-[#24211B] text-[#F7F5F1]"
                  : ready
                    ? "border-[#C8A96E]/25 bg-[#201D17] text-[#F7F5F1] hover:border-[#C8A96E] hover:bg-[#26221B]"
                    : "border-transparent bg-[#2A2721]/40 text-[#F7F5F1]/35 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-md bg-[#1A1814] border border-[#C8A96E]/30 text-[#F7F5F1] flex items-center justify-center">
                  <PlatformGlyph id={p.id} shortLabel={p.shortLabel} />
                </span>
                {ready && <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E]" />}
              </div>
              <p className="mt-2 text-xs text-[#F7F5F1]">{p.label}</p>
              {ready && (
                <p className="mt-0.5 text-[10px] text-[#C8A96E] tracking-wide">
                  {p.id === "facebook" ? "Open composer" : "Content ready"}
                </p>
              )}
            </button>
          );
        })}
        </div>
      </div>

      {/* Content panel */}
      {active && (
        <div className="bg-white border-2 border-gilt/30 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg text-ink">
              {PLATFORMS.find(p => p.id === active)?.label} Content
            </h4>
            <button
              onClick={() => setActive(null)}
              className="font-sans text-xs text-stone hover:text-ink"
            >
              Close ✕
            </button>
          </div>

          {/* MLS */}
          {active === "mls" && platform_content?.mls && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Copy each field and paste directly into your MLS system. Never auto-submits — always requires your review.
              </p>
              <PhotoStrip photos={photos} max={5} label="Photos to attach" />
              <FieldBlock label="Public Description" text={platform_content.mls.description} limit={500} note="Shown to buyers on all MLS-connected sites" />
              <FieldBlock label="Agent Remarks" text={platform_content.mls.agent_remarks} limit={200} note="Visible to agents only — showing instructions, offers, etc." />
              <BulletList label="Key Highlights" items={platform_content.mls.highlights} />
            </div>
          )}

          {/* Zillow */}
          {active === "zillow" && platform_content?.zillow && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                Go to Zillow → My Listings → Edit listing. Copy each field below into the matching section.
              </p>
              <PhotoStrip photos={photos} max={5} label="Photos to upload to Zillow" />
              <FieldBlock label="Property Description" text={platform_content.zillow.description} limit={2500} note="Paste into Zillow's 'Description' field" />
              <BulletList label="Home Highlights" items={platform_content.zillow.highlights} />
              <FieldBlock label="What I Love About This Home" text={platform_content.zillow.what_i_love} limit={500} note="Seller perspective — paste into Zillow's 'What I Love' section" />
            </div>
          )}

          {/* Realtor.com */}
          {active === "realtor_com" && platform_content?.realtor_com && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-red-50 border border-red-200 rounded-md px-3 py-2">
                Go to Realtor.com → Manage Listings → Edit. Paste the description and highlights below.
              </p>
              <PhotoStrip photos={photos} max={5} label="Photos to upload to Realtor.com" />
              <FieldBlock label="Property Description" text={platform_content.realtor_com.description} limit={3000} note="Paste into Realtor.com's description field" />
              <BulletList label="Key Features" items={platform_content.realtor_com.highlights} />
            </div>
          )}

          {/* Facebook */}
          {active === "facebook" && social_captions?.facebook && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Launch the dark-mode Facebook composer with a fresh caption and AI image.</p>
              </div>
              {isLocked && (
                isPublishPlan ? (
                  <button
                    onClick={() => void launchFacebookComposer()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1814] border border-[#C8A96E]/60 text-[#F7F5F1] font-sans text-sm rounded-lg hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors"
                  >
                    Open Facebook Composer
                  </button>
                ) : (
                  <div className="bg-gilt/10 border border-gilt/30 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-sans text-sm font-medium text-ink">Post directly to Facebook & Instagram</p>
                      <p className="font-sans text-xs text-stone mt-0.5">Upgrade to Limen Publish ($79/mo) to post listings directly.</p>
                    </div>
                    <a href="/subscribe" className="flex-shrink-0 bg-gilt text-ink px-4 py-2 font-sans text-xs tracking-widest uppercase hover:bg-ink hover:text-gilt transition-colors">Upgrade →</a>
                  </div>
                )
              )}
              <FacebookPreview caption={getCaption("facebook")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}

          {/* Instagram */}
          {active === "instagram" && social_captions?.instagram && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Review your card and caption before posting.</p>
                <RegenButtons platform="instagram" />
              </div>
              {isLocked && (
                isPublishPlan ? (
                  postedPlatforms.has("instagram") ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 font-sans text-xs font-medium">✓ Posted to Instagram</div>
                  ) : (
                    <button onClick={() => setInstagramModal({ caption: getCaption("instagram") })} className="flex items-center gap-2 px-5 py-2.5 text-white font-sans text-sm font-medium rounded-lg hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)" }}>
                      📷 Review & Post to Instagram
                    </button>
                  )
                ) : (
                  <div className="bg-gilt/10 border border-gilt/30 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-sans text-sm font-medium text-ink">Post directly to Facebook & Instagram</p>
                      <p className="font-sans text-xs text-stone mt-0.5">Upgrade to Limen Publish ($79/mo) to post listings directly.</p>
                    </div>
                    <a href="/subscribe" className="flex-shrink-0 bg-gilt text-ink px-4 py-2 font-sans text-xs tracking-widest uppercase hover:bg-ink hover:text-gilt transition-colors">Upgrade →</a>
                  </div>
                )
              )}
              <InstagramPreview caption={getCaption("instagram")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}

          {/* TikTok */}
          {active === "tiktok" && social_captions?.tiktok && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Walking-tour script. Download the card as your TikTok cover image.</p>
                <RegenButtons platform="tiktok" />
              </div>
              <TikTokPreview caption={getCaption("tiktok")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}

          {/* LinkedIn */}
          {active === "linkedin" && social_captions?.linkedin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Professional reach — ideal for move-up buyers and investors.</p>
                <RegenButtons platform="linkedin" />
              </div>
              <LinkedInPreview caption={getCaption("linkedin")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}

          {/* Nextdoor */}
          {active === "nextdoor" && social_captions?.nextdoor && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Post in the For Sale section of your neighborhood feed.</p>
                <RegenButtons platform="nextdoor" />
              </div>
              <NextdoorPreview caption={getCaption("nextdoor")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}

          {/* Google */}
          {active === "google" && platform_content?.google && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-stone/5 border border-stone/20 rounded-md px-3 py-2">
                Go to your Google Business dashboard → Add Update → What&apos;s New. Paste the text and attach the cover photo.
              </p>
              <PhotoStrip photos={photos.slice(0, 1)} max={1} label="Attach cover photo to Google post" />
              <FieldBlock label="Google Business Post" text={platform_content.google.post} limit={1500} note="Appears in Google Search and Maps for your business" />
            </div>
          )}

          {/* Twitter/X */}
          {active === "twitter" && social_captions?.twitter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-xs text-stone">Download the card or copy the text. Attach your cover photo.</p>
                <RegenButtons platform="twitter" />
              </div>
              <TwitterPreview caption={getCaption("twitter")} aiImageUrl={aiImageUrl} photos={photos} address={address} price={price} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} brand={brand} agentName={agentName} agentPhone={agentPhone} agentWebsite={agentWebsite} logoUrl={logoUrl} headshotUrl={headshotUrl} />
            </div>
          )}
        </div>
      )}

      {/* Instagram Approval Modal */}
      {instagramModal && (
        <PostApprovalModal
          platform="instagram"
          initialCaption={instagramModal.caption}
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
          selectedVariation={"cinematic"}
          listingId={listingId}
          onClose={() => setInstagramModal(null)}
          onPosted={(platform) => {
            setPostedPlatforms(prev => new Set(Array.from(prev).concat(platform)));
            setInstagramModal(null);
          }}
        />
      )}

      {facebookModalOpen && (
        <FacebookPostPreviewModal
          caption={facebookCaption}
          predictionId={facebookPredictionId}
          requestPending={facebookPending}
          requestError={facebookModalError}
          onClose={() => {
            setFacebookModalOpen(false);
            setFacebookPredictionId(null);
            setFacebookModalError(null);
          }}
        />
      )}
    </div>
  );
}
