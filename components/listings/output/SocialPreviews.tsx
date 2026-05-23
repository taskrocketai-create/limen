"use client";

import { useRef, useState } from "react";

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
}

interface SocialPreviewProps {
  caption: string;
  photos: Photo[];
  address: string;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="px-3 py-1.5 border border-stone/20 rounded font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors"
    >
      {copied ? "✓ Copied" : "Copy text"}
    </button>
  );
}

function DownloadButton({ cardRef, filename }: { cardRef: React.RefObject<HTMLDivElement>; filename: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => { setLoading(true); await downloadCard(cardRef, filename); setLoading(false); }}
      className="px-3 py-1.5 bg-ink text-gilt border border-ink rounded font-sans text-xs hover:bg-gilt hover:text-ink transition-colors"
    >
      {loading ? "Saving…" : "⬇ Download image"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Facebook Preview
// ---------------------------------------------------------------------------
export function FacebookPreview({ caption, photos, address }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const grid = photos.slice(1, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">Facebook post preview</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="facebook-post.png" />
        </div>
      </div>

      <div ref={cardRef} className="bg-white rounded-lg overflow-hidden border border-stone/10 max-w-[500px] mx-auto shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">RE</div>
          <div>
            <p className="font-sans text-sm font-semibold text-gray-900">{address}</p>
            <p className="font-sans text-xs text-gray-500">Just now · 🌐</p>
          </div>
        </div>

        {/* Caption */}
        <div className="px-3 pb-2">
          <p className="font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-6">{caption}</p>
        </div>

        {/* Photos */}
        {cover && (
          <div className="w-full">
            {grid.length === 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt="Listing" className="w-full h-64 object-cover" crossOrigin="anonymous" />
            )}
            {grid.length === 1 && (
              <div className="grid grid-cols-2 gap-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt="Listing" className="w-full h-48 object-cover" crossOrigin="anonymous" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={grid[0].url} alt="Listing" className="w-full h-48 object-cover" crossOrigin="anonymous" />
              </div>
            )}
            {grid.length >= 2 && (
              <div className="grid grid-cols-2 gap-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt="Listing" className="w-full h-56 object-cover row-span-2" crossOrigin="anonymous" />
                <div className="flex flex-col gap-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={grid[0].url} alt="Listing" className="w-full h-[108px] object-cover" crossOrigin="anonymous" />
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={grid[1].url} alt="Listing" className="w-full h-[108px] object-cover" crossOrigin="anonymous" />
                    {photos.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-sans text-xl font-bold">+{photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement bar */}
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-1 items-center">
            <span className="text-sm">👍</span><span className="text-sm">❤️</span>
            <span className="font-sans text-xs text-gray-500 ml-1">Be the first to react</span>
          </div>
          <div className="flex gap-4">
            <button className="font-sans text-xs text-gray-500 font-medium">Like</button>
            <button className="font-sans text-xs text-gray-500 font-medium">Comment</button>
            <button className="font-sans text-xs text-gray-500 font-medium">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instagram Preview
// ---------------------------------------------------------------------------
export function InstagramPreview({ caption, photos, address }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const hashtagSplit = caption.split("#");
  const mainText = hashtagSplit[0].trim();
  const hashtags = hashtagSplit.length > 1 ? "#" + hashtagSplit.slice(1).join("#") : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">Instagram post preview</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="instagram-post.png" />
        </div>
      </div>

      <div ref={cardRef} className="bg-white max-w-[400px] mx-auto border border-stone/10 rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="font-bold text-xs text-pink-500">RE</span>
              </div>
            </div>
            <div>
              <p className="font-sans text-xs font-semibold text-gray-900">realtor_agent</p>
              <p className="font-sans text-[10px] text-gray-500">{address.split(",")[0]}</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg">···</span>
        </div>

        {/* Square photo */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full aspect-square object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full aspect-square bg-parchment flex items-center justify-center">
            <span className="font-sans text-xs text-stone">No photo uploaded</span>
          </div>
        )}

        {/* Actions */}
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <div className="flex gap-4">
            <span className="text-xl">🤍</span>
            <span className="text-xl">💬</span>
            <span className="text-xl">↗</span>
          </div>
          <span className="text-xl">🔖</span>
        </div>

        {/* Caption */}
        <div className="px-3 pb-3 space-y-1">
          <p className="font-sans text-xs font-semibold text-gray-900">realtor_agent <span className="font-normal text-gray-800">{mainText.slice(0, 120)}{mainText.length > 120 ? "… more" : ""}</span></p>
          {hashtags && <p className="font-sans text-xs text-blue-500">{hashtags.slice(0, 100)}</p>}
          <p className="font-sans text-[10px] text-gray-400 uppercase tracking-wide">View all comments</p>
          <p className="font-sans text-[10px] text-gray-400">Just now</p>
        </div>

        {/* Story dots if multiple photos */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {photos.slice(0, 5).map((_, i) => (
              <div key={i} className={`rounded-full ${i === 0 ? "w-2 h-2 bg-blue-500" : "w-1.5 h-1.5 bg-gray-300"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TikTok Preview
// ---------------------------------------------------------------------------
export function TikTokPreview({ caption, photos }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];
  const lines = caption.split("\n").filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">TikTok / Reels script + thumbnail</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="tiktok-thumbnail.png" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone frame */}
        <div ref={cardRef} className="relative mx-auto w-[220px] h-[390px] rounded-3xl overflow-hidden bg-black shadow-xl border-4 border-gray-800">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="Cover" className="w-full h-full object-cover opacity-80" crossOrigin="anonymous" />
          ) : (
            <div className="w-full h-full bg-gray-900" />
          )}

          {/* Overlay UI */}
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            {/* Top bar */}
            <div className="flex justify-between items-center">
              <span className="text-white font-sans text-xs font-bold">Following</span>
              <span className="text-white font-sans text-xs font-bold">For You</span>
              <span className="text-white text-sm">🔍</span>
            </div>

            {/* Bottom info */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex-1 pr-4">
                  <p className="text-white font-sans text-xs font-semibold">@realtor_agent</p>
                  <p className="text-white font-sans text-[10px] mt-0.5 leading-relaxed line-clamp-3">
                    {lines[0] ?? caption.slice(0, 80)}
                  </p>
                  <p className="text-white/70 font-sans text-[10px] mt-1">🎵 Original Sound</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                  <div className="text-center"><span className="text-white text-lg">🤍</span><p className="text-white font-sans text-[9px]">24.5K</p></div>
                  <div className="text-center"><span className="text-white text-lg">💬</span><p className="text-white font-sans text-[9px]">342</p></div>
                  <div className="text-center"><span className="text-white text-lg">↗</span><p className="text-white font-sans text-[9px]">Share</p></div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-0.5 bg-white/30 rounded-full">
                <div className="w-1/3 h-full bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Script */}
        <div className="bg-parchment border border-stone/20 rounded-lg p-4 space-y-3">
          <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">Video Script</p>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <p key={i} className="font-sans text-xs text-ink leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Twitter/X Preview
// ---------------------------------------------------------------------------
export function TwitterPreview({ caption, photos }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">X / Twitter post preview</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="twitter-post.png" />
        </div>
      </div>

      <div ref={cardRef} className="bg-white max-w-[500px] mx-auto border border-stone/10 rounded-2xl overflow-hidden shadow-sm p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">RE</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1">
              <span className="font-sans text-sm font-bold text-gray-900">Realtor Agent</span>
              <span className="text-blue-500 text-sm">✓</span>
              <span className="font-sans text-xs text-gray-500">@realtor_agent · now</span>
            </div>
            <p className="font-sans text-sm text-gray-900 leading-relaxed">{caption}</p>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt="Listing" className="w-full h-48 object-cover rounded-xl mt-2" crossOrigin="anonymous" />
            )}
            <div className="flex items-center justify-between pt-1 text-gray-500 text-xs">
              <span>💬 Reply</span>
              <span>🔁 Repost</span>
              <span>🤍 Like</span>
              <span>📊 Views</span>
              <span>↗ Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LinkedIn Preview
// ---------------------------------------------------------------------------
export function LinkedInPreview({ caption, photos, address }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">LinkedIn post preview</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="linkedin-post.png" />
        </div>
      </div>

      <div ref={cardRef} className="bg-white max-w-[500px] mx-auto border border-stone/10 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">RE</div>
            <div>
              <p className="font-sans text-sm font-semibold text-gray-900">Real Estate Agent</p>
              <p className="font-sans text-xs text-gray-500">REALTOR® · {address.split(",").slice(1).join(",").trim()}</p>
              <p className="font-sans text-xs text-gray-400">Just now · 🌐</p>
            </div>
          </div>
          <p className="font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-5">{caption}</p>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full h-56 object-cover" crossOrigin="anonymous" />
        )}
        {cover && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="font-sans text-xs font-semibold text-gray-800">{address}</p>
            <p className="font-sans text-xs text-gray-500">limenai.org</p>
          </div>
        )}
        <div className="px-4 py-2 border-t border-gray-100 flex gap-4">
          <button className="font-sans text-xs text-gray-500 font-medium">👍 Like</button>
          <button className="font-sans text-xs text-gray-500 font-medium">💬 Comment</button>
          <button className="font-sans text-xs text-gray-500 font-medium">🔁 Repost</button>
          <button className="font-sans text-xs text-gray-500 font-medium">↗ Send</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nextdoor Preview
// ---------------------------------------------------------------------------
export function NextdoorPreview({ caption, photos, address }: SocialPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cover = photos[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-sans text-xs text-stone">Nextdoor post preview</p>
        <div className="flex gap-2">
          <CopyButton text={caption} />
          <DownloadButton cardRef={cardRef} filename="nextdoor-post.png" />
        </div>
      </div>

      <div ref={cardRef} className="bg-white max-w-[500px] mx-auto border border-stone/10 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">RE</div>
            <div>
              <p className="font-sans text-sm font-semibold text-gray-900">Real Estate Agent</p>
              <p className="font-sans text-xs text-gray-500">📍 {address.split(",")[1]?.trim() ?? "Local Neighborhood"}</p>
            </div>
            <span className="ml-auto bg-green-100 text-green-700 font-sans text-xs px-2 py-0.5 rounded-full">For Sale</span>
          </div>
          <p className="font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{caption}</p>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="Listing" className="w-full h-48 object-cover" crossOrigin="anonymous" />
        )}
        <div className="px-4 py-2 border-t border-gray-100 flex gap-4">
          <button className="font-sans text-xs text-gray-500">👍 Thank</button>
          <button className="font-sans text-xs text-gray-500">💬 Comment</button>
          <button className="font-sans text-xs text-gray-500">↗ Share</button>
        </div>
      </div>
    </div>
  );
}
