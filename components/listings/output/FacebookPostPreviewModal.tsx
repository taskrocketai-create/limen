"use client";

import { useEffect, useMemo, useState } from "react";

interface FacebookPostPreviewModalProps {
  caption: string;
  predictionId: string | null;
  requestPending: boolean;
  requestError: string | null;
  onClose: () => void;
}

type ReplicateStatus = "processing" | "succeeded" | "failed";

export default function FacebookPostPreviewModal({
  caption,
  predictionId,
  requestPending,
  requestError,
  onClose,
}: FacebookPostPreviewModalProps) {
  const [editableCaption, setEditableCaption] = useState(caption);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<ReplicateStatus>("processing");
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    setEditableCaption(caption);
  }, [caption]);

  useEffect(() => {
    setImageUrl(null);
    setImageStatus("processing");
    setPollError(null);
  }, [predictionId]);

  useEffect(() => {
    if (!predictionId) return;

    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/replicate/${predictionId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to check image status.");
        }

        if (!active) return;

        if (data.status === "succeeded" && data.imageUrl) {
          setImageStatus("succeeded");
          setImageUrl(data.imageUrl);
          return;
        }

        if (data.status === "failed") {
          setImageStatus("failed");
          return;
        }

        setImageStatus("processing");
      } catch (error) {
        if (!active) return;
        setPollError(error instanceof Error ? error.message : "Unable to poll image status.");
        setImageStatus("failed");
      }
    };

    poll();
    const intervalId = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [predictionId]);

  const showSkeleton = requestPending || imageStatus === "processing";

  const statusLabel = useMemo(() => {
    if (requestPending) return "Starting image generation…";
    if (imageStatus === "succeeded") return "Image ready";
    if (imageStatus === "failed") return "Image failed";
    return "Image processing…";
  }, [imageStatus, requestPending]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-stretch sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[640px] bg-[#1A1814] text-[#F7F5F1] border border-[#C8A96E]/40 overflow-y-auto animate-[fadeIn_200ms_ease-out]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 w-8 h-8 rounded-full border border-[#C8A96E]/40 text-[#F7F5F1] hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <header className="pr-10">
            <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#C8A96E]">Social Composer</p>
            <h2 className="font-display text-3xl text-[#F7F5F1]">Facebook Post Preview</h2>
          </header>

          <div className="space-y-2">
            <div className="relative rounded-xl border border-[#C8A96E]/40 bg-[#211F1A] min-h-[220px] overflow-hidden">
              {showSkeleton ? (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#2A2721] via-[#343026] to-[#2A2721]" />
              ) : null}

              {imageUrl ? (
                <div className="relative h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Generated listing preview"
                    className="w-full h-full object-cover transition-opacity duration-500 opacity-100"
                  />
                  <span className="absolute right-3 bottom-3 px-2 py-1 rounded bg-[#1A1814]/80 text-[#F7F5F1] text-[10px] font-sans tracking-[0.18em] uppercase">
                    Limen
                  </span>
                </div>
              ) : null}
            </div>
            <p className="font-sans text-xs text-[#C8A96E]">{statusLabel}</p>
            {(requestError || pollError) && (
              <p className="font-sans text-xs text-red-300">{requestError || pollError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="font-sans text-xs uppercase tracking-[0.18em] text-[#C8A96E]">Caption</label>
            <textarea
              value={editableCaption}
              onChange={(event) => setEditableCaption(event.target.value)}
              rows={9}
              className="w-full resize-none rounded-xl border border-[#C8A96E]/60 bg-[#13110F] px-4 py-3 font-sans text-sm leading-relaxed text-[#F7F5F1] focus:outline-none focus:border-[#C8A96E]"
              placeholder="Your Facebook caption will appear here..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(editableCaption);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 rounded-lg border border-[#C8A96E]/60 text-[#F7F5F1] font-sans text-sm hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors"
            >
              {copied ? "✓ Copied" : "Copy Caption"}
            </button>

            {imageUrl && (
              <a
                href={imageUrl}
                download
                className="px-4 py-2 rounded-lg border border-[#C8A96E]/60 text-[#F7F5F1] font-sans text-sm hover:border-[#C8A96E] hover:text-[#C8A96E] transition-colors"
              >
                Download Image
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
