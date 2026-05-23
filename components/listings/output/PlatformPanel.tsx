"use client";

import { useState } from "react";
import {
  FacebookPreview,
  InstagramPreview,
  TikTokPreview,
  TwitterPreview,
  LinkedInPreview,
  NextdoorPreview,
} from "@/components/listings/output/SocialPreviews";

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

const PLATFORMS: { id: PlatformId; label: string; color: string; emoji: string }[] = [
  { id: "mls", label: "MLS", color: "bg-ink text-gilt", emoji: "🏠" },
  { id: "zillow", label: "Zillow", color: "bg-blue-600 text-white", emoji: "Z" },
  { id: "realtor_com", label: "Realtor.com", color: "bg-red-600 text-white", emoji: "R" },
  { id: "facebook", label: "Facebook", color: "bg-blue-500 text-white", emoji: "f" },
  { id: "instagram", label: "Instagram", color: "bg-pink-500 text-white", emoji: "IG" },
  { id: "tiktok", label: "TikTok", color: "bg-black text-white", emoji: "TT" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-700 text-white", emoji: "in" },
  { id: "nextdoor", label: "Nextdoor", color: "bg-green-600 text-white", emoji: "ND" },
  { id: "google", label: "Google", color: "bg-white text-ink border border-stone/20", emoji: "G" },
  { id: "twitter", label: "X / Twitter", color: "bg-black text-white", emoji: "X" },
];

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

export default function PlatformPanel({ social_captions, platform_content, photos, address }: PlatformPanelProps) {
  const [active, setActive] = useState<PlatformId | null>(null);

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
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const ready = hasContent(p.id);
          return (
            <button
              key={p.id}
              onClick={() => setActive(active === p.id ? null : p.id)}
              disabled={!ready}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-sans text-sm font-medium transition-all border-2 ${
                active === p.id
                  ? "border-gilt shadow-md scale-105"
                  : ready
                  ? "border-transparent hover:border-gilt/40"
                  : "border-transparent opacity-40 cursor-not-allowed"
              } ${p.color}`}
            >
              <span className="text-xs font-bold">{p.emoji}</span>
              {p.label}
              {ready && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
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
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                Screenshot or download the preview below, then post directly to Facebook with your photos attached.
              </p>
              <FacebookPreview caption={social_captions.facebook} photos={photos} address={address} />
            </div>
          )}

          {/* Instagram */}
          {active === "instagram" && social_captions?.instagram && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-pink-50 border border-pink-200 rounded-md px-3 py-2">
                Download the preview card below or copy the caption. Post to Instagram with your best photo as the cover.
              </p>
              <InstagramPreview caption={social_captions.instagram} photos={photos} address={address} />
            </div>
          )}

          {/* TikTok */}
          {active === "tiktok" && social_captions?.tiktok && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-stone/5 border border-stone/20 rounded-md px-3 py-2">
                Use this script for a walking-tour video. Download the thumbnail card to use as your TikTok cover image.
              </p>
              <TikTokPreview caption={social_captions.tiktok} photos={photos} address={address} />
            </div>
          )}

          {/* LinkedIn */}
          {active === "linkedin" && social_captions?.linkedin && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                Download the preview or copy the text. Post to LinkedIn for professional network reach.
              </p>
              <LinkedInPreview caption={social_captions.linkedin} photos={photos} address={address} />
            </div>
          )}

          {/* Nextdoor */}
          {active === "nextdoor" && social_captions?.nextdoor && (
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-green-50 border border-green-200 rounded-md px-3 py-2">
                Download the preview or copy the text. Post in the For Sale section of your neighborhood feed.
              </p>
              <NextdoorPreview caption={social_captions.nextdoor} photos={photos} address={address} />
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
            <div className="space-y-5">
              <p className="font-sans text-xs text-stone bg-stone/5 border border-stone/20 rounded-md px-3 py-2">
                Download the preview card or copy the text. Attach your cover photo for maximum engagement.
              </p>
              <TwitterPreview caption={social_captions.twitter} photos={photos} address={address} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
