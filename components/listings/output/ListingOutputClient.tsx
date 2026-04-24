"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/utils/supabase/client";
import type { ListingStatus, PropertyType } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AiOutput {
  id: string;
  version: number;
  listing_description: string | null;
  headline_variants: string[] | null;
  social_captions: { instagram?: string; facebook?: string; twitter?: string } | null;
  generated_at: string;
  approved: boolean;
  approved_at: string | null;
}

interface ListingDetail {
  highlights: string[] | null;
  recent_updates: string | null;
  neighborhood_notes: string | null;
  hoa_details: string | null;
  seller_notes: string | null;
}

interface ListingOutputClientProps {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  property_type: PropertyType | null;
  status: ListingStatus;
  intake_token: string;
  intake_sent_at: string | null;
  intake_completed_at: string | null;
  mls_number: string | null;
  listing_details: ListingDetail | null;
  ai_outputs: AiOutput[];
  photos: string[];
  allowPhotoUpload: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(p: number | null) {
  if (!p) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="font-sans text-xs text-stone hover:text-gilt transition-colors"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Social caption card
// ---------------------------------------------------------------------------
function SocialCard({ platform, caption }: { platform: string; caption: string }) {
  const icons: Record<string, string> = { Instagram: "IG", Facebook: "FB", Twitter: "X" };
  return (
    <div className="border border-stone/20 rounded-md p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-ink text-gilt flex items-center justify-center font-sans text-[10px] font-bold flex-shrink-0">
            {icons[platform]}
          </span>
          <span className="font-sans text-sm font-medium text-ink">{platform}</span>
        </div>
        <CopyButton text={caption} />
      </div>
      <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">{caption}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ListingOutputClient(props: ListingOutputClientProps) {
  const {
    id, address_line1, city, state, zip,
    price, bedrooms, bathrooms, sqft, status,
    intake_token, intake_sent_at, intake_completed_at,
    listing_details, ai_outputs, photos: initialPhotos, allowPhotoUpload,
  } = props;

  const [isPending, startTransition] = useTransition();
  const [outputs, setOutputs] = useState<AiOutput[]>(ai_outputs);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [activeVersion, setActiveVersion] = useState<string | null>(
    ai_outputs.length > 0 ? ai_outputs[0].id : null
  );
  const [approving, setApproving] = useState(false);
  const [mlsPending, setMlsPending] = useState(false);
  const [mlsError, setMlsError] = useState("");
  const [mlsSuccess, setMlsSuccess] = useState(false);
  const [intakeCopied, setIntakeCopied] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const currentOutput = outputs.find((o) => o.id === activeVersion) ?? outputs[0] ?? null;
  const intakeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/intake/${intake_token}`;

  // ── Generate AI copy ──────────────────────────────────────────────────────
  function generateCopy() {
    setGenerating(true);
    setGenError("");
    startTransition(async () => {
      const res = await fetch(`/api/listings/${id}/generate`, { method: "POST" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setGenError(b.error ?? "Generation failed. Please try again.");
        setGenerating(false);
        return;
      }
      const newOutput: AiOutput = await res.json();
      setOutputs((prev) => [newOutput, ...prev]);
      setActiveVersion(newOutput.id);
      setGenerating(false);
    });
  }

  // ── Approve output ────────────────────────────────────────────────────────
  function approveOutput() {
    if (!currentOutput) return;
    setApproving(true);
    startTransition(async () => {
      await fetch(`/api/listings/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_id: currentOutput.id }),
      });
      setOutputs((prev) =>
        prev.map((o) =>
          o.id === currentOutput.id
            ? { ...o, approved: true, approved_at: new Date().toISOString() }
            : o
        )
      );
      setApproving(false);
    });
  }

  // ── Copy intake link ──────────────────────────────────────────────────────
  function copyIntakeLink() {
    navigator.clipboard.writeText(intakeUrl);
    setIntakeCopied(true);
    setTimeout(() => setIntakeCopied(false), 2000);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0 || !allowPhotoUpload) return;

    setUploadingPhotos(true);
    setPhotoError("");

    const supabase = createClient();
    const selectedFiles = Array.from(files);
    const uploadedPaths: string[] = [];
    const newPhotoUrls: string[] = [];
    const baseSortOrder = photos.length;

    try {
      for (let i = 0; i < selectedFiles.length; i += 1) {
        const file = selectedFiles[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${id}/${Date.now()}-${i}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase
          .storage
          .from("listing-assets")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) throw new Error(uploadError.message);

        uploadedPaths.push(path);

        const { error: insertError } = await supabase
          .from("listing_assets")
          .insert({
            listing_id: id,
            storage_path: path,
            asset_type: "photo",
            sort_order: baseSortOrder + i,
            uploaded_by: "realtor",
          });

        if (insertError) throw new Error(insertError.message);
      }

      const { data: signed } = await supabase
        .storage
        .from("listing-assets")
        .createSignedUrls(uploadedPaths, 3600);

      for (const item of signed ?? []) {
        if (item?.signedUrl) newPhotoUrls.push(item.signedUrl);
      }

      setPhotos((prev) => [...prev, ...newPhotoUrls]);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploadingPhotos(false);
    }
  }

  // ── Submit to MLS ─────────────────────────────────────────────────────────
  function submitToMLS() {
    setMlsPending(true);
    setMlsError("");
    startTransition(async () => {
      const res = await fetch(`/api/listings/${id}/mls-submit`, { method: "POST" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setMlsError(b.error ?? "MLS submission failed.");
        setMlsPending(false);
        return;
      }
      setMlsSuccess(true);
      setMlsPending(false);
    });
  }

  const canGenerate = status === "intake_received" || status === "ai_ready" || status === "reviewed";
  const approvedOutput = outputs.find((o) => o.approved);
  const canSubmitMLS = !!approvedOutput && status === "reviewed" && !mlsSuccess;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Nav */}
      <header className="bg-ink sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Logo size={28} variant="primary" label="Limen" />
            </Link>
            <span className="font-sans text-stone/60 text-xs hidden sm:block">
              /
            </span>
            <Link href="/dashboard" className="font-sans text-xs text-stone hover:text-parchment transition-colors hidden sm:block">
              Dashboard
            </Link>
            <span className="font-sans text-stone/60 text-xs hidden sm:block">/</span>
            <span className="font-sans text-xs text-parchment truncate max-w-[200px] hidden sm:block">
              {address_line1}
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Property info + intake ── */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Property card */}
            <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-3">
              <h1 className="font-display text-2xl text-ink leading-tight">{address_line1}</h1>
              <p className="font-sans text-sm text-stone">{city}, {state} {zip}</p>
              {price && <p className="font-display text-3xl text-gilt">{formatPrice(price)}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-stone pt-1">
                {bedrooms != null && <span>{bedrooms} bd</span>}
                {bathrooms != null && <span>{bathrooms} ba</span>}
                {sqft != null && <span>{sqft.toLocaleString()} sqft</span>}
              </div>

              <div className="pt-2 space-y-3">
                <h2 className="font-display text-lg text-ink">Photos</h2>
                {allowPhotoUpload && (
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-stone/20 rounded-md font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors cursor-pointer">
                      <span>{uploadingPhotos ? "Uploading…" : "Upload photos"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingPhotos}
                        className="hidden"
                        onChange={(e) => uploadPhotos(e.target.files)}
                      />
                    </label>
                    <p className="font-sans text-[11px] text-stone/70">
                      JPG, PNG, WEBP, or HEIC. You can select multiple files.
                    </p>
                  </div>
                )}
                {photoError && (
                  <p className="font-sans text-xs text-red-600">{photoError}</p>
                )}
                {photos.length === 0 ? (
                  <p className="font-sans text-xs text-stone/70">No photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${photo}-${idx}`}
                        src={photo}
                        alt={`${address_line1} photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border border-stone/20"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Intake status */}
            <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-3">
              <h2 className="font-display text-lg text-ink">Homeowner intake</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  intake_completed_at ? "bg-emerald-500" : intake_sent_at ? "bg-amber-400" : "bg-stone/30"
                }`} />
                <span className="font-sans text-sm text-stone">
                  {intake_completed_at
                    ? "Received"
                    : intake_sent_at
                    ? "Sent — awaiting response"
                    : "Not yet sent"}
                </span>
              </div>

              {/* Intake link */}
              <div className="space-y-1">
                <p className="font-sans text-xs text-stone">Private intake link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-sans text-xs bg-parchment text-ink px-2 py-1.5 rounded truncate border border-stone/10">
                    /intake/{intake_token.slice(0, 8)}…
                  </code>
                  <button
                    onClick={copyIntakeLink}
                    className="flex-shrink-0 px-3 py-1.5 border border-stone/20 rounded font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors"
                  >
                    {intakeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Homeowner intake detail */}
            {listing_details && (
              <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-4">
                <h2 className="font-display text-lg text-ink">Intake responses</h2>

                {listing_details.highlights && listing_details.highlights.length > 0 && (
                  <div>
                    <p className="font-sans text-xs font-medium text-stone mb-2">Highlights</p>
                    <div className="flex flex-wrap gap-1.5">
                      {listing_details.highlights.map((h) => (
                        <span key={h} className="px-2 py-0.5 bg-gilt/10 text-ink font-sans text-xs rounded-full border border-gilt/20">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {listing_details.recent_updates && (
                  <div>
                    <p className="font-sans text-xs font-medium text-stone mb-1">Recent updates</p>
                    <p className="font-sans text-sm text-ink leading-relaxed">{listing_details.recent_updates}</p>
                  </div>
                )}

                {listing_details.neighborhood_notes && (
                  <div>
                    <p className="font-sans text-xs font-medium text-stone mb-1">Neighbourhood</p>
                    <p className="font-sans text-sm text-ink leading-relaxed">{listing_details.neighborhood_notes}</p>
                  </div>
                )}

                {listing_details.seller_notes && (
                  <div>
                    <p className="font-sans text-xs font-medium text-stone mb-1">Seller notes</p>
                    <p className="font-sans text-sm text-ink leading-relaxed">{listing_details.seller_notes}</p>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ── RIGHT: AI output + social studio ── */}
          <main className="lg:col-span-2 space-y-6">

            {/* Generate button / state */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-display text-3xl text-ink">Listing copy</h2>
              <div className="flex items-center gap-3">
                {outputs.length > 1 && (
                  <select
                    className="font-sans text-xs text-stone border border-stone/20 rounded px-2 py-1.5 focus:outline-none focus:border-gilt bg-white"
                    value={activeVersion ?? ""}
                    onChange={(e) => setActiveVersion(e.target.value)}
                  >
                    {outputs.map((o) => (
                      <option key={o.id} value={o.id}>
                        v{o.version}{o.approved ? " ✓ Approved" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={generateCopy}
                  disabled={generating || isPending || !canGenerate}
                  className="px-4 py-2 bg-ink text-gilt font-sans text-sm font-medium rounded-md hover:bg-midnight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? "Generating…" : outputs.length > 0 ? "Regenerate" : "Generate copy"}
                </button>
              </div>
            </div>

            {genError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="font-sans text-sm text-red-700">{genError}</p>
              </div>
            )}

            {!canGenerate && !currentOutput && (
              <div className="bg-white border border-stone/20 rounded-lg p-10 text-center space-y-3">
                <svg width="40" height="55" viewBox="0 0 36 50" fill="none" className="mx-auto" aria-hidden>
                  <rect x="0" y="4" width="36" height="6" fill="#6B6456" opacity="0.3" />
                  <rect x="0" y="4" width="6" height="46" fill="#6B6456" opacity="0.3" />
                  <rect x="30" y="4" width="6" height="46" fill="#6B6456" opacity="0.3" />
                </svg>
                <p className="font-display text-xl text-stone">Waiting for homeowner intake</p>
                <p className="font-sans text-sm text-stone/60">
                  Once the homeowner submits their intake form, you can generate AI listing copy.
                </p>
              </div>
            )}

            {/* AI output */}
            {currentOutput && (
              <div className="space-y-5">
                {/* Approval bar */}
                <div className="flex items-center justify-between p-3 bg-white border border-stone/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    {currentOutput.approved ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-sans text-sm text-emerald-700 font-medium">Approved</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-stone/30" />
                        <span className="font-sans text-sm text-stone">Not yet approved</span>
                      </>
                    )}
                    <span className="font-sans text-xs text-stone/50 ml-2">v{currentOutput.version}</span>
                  </div>
                  {!currentOutput.approved && (
                    <button
                      onClick={approveOutput}
                      disabled={approving}
                      className="px-3 py-1.5 bg-gilt text-ink font-sans text-xs font-medium rounded-md hover:bg-gilt/90 transition-colors disabled:opacity-60"
                    >
                      {approving ? "Approving…" : "Approve this version"}
                    </button>
                  )}
                </div>

                {/* Headlines */}
                {currentOutput.headline_variants && currentOutput.headline_variants.length > 0 && (
                  <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-ink">Headlines</h3>
                    </div>
                    <div className="space-y-2">
                      {currentOutput.headline_variants.map((h, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 p-3 bg-parchment rounded-md">
                          <p className="font-display text-xl text-ink leading-snug">{h}</p>
                          <CopyButton text={h} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {currentOutput.listing_description && (
                  <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-ink">Listing description</h3>
                      <CopyButton text={currentOutput.listing_description} />
                    </div>
                    <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">
                      {currentOutput.listing_description}
                    </p>
                  </div>
                )}

                {/* Social studio */}
                {currentOutput.social_captions && (
                  <div className="space-y-3">
                    <h3 className="font-display text-xl text-ink">Social studio</h3>
                    <div className="space-y-3">
                      {currentOutput.social_captions.instagram && (
                        <SocialCard platform="Instagram" caption={currentOutput.social_captions.instagram} />
                      )}
                      {currentOutput.social_captions.facebook && (
                        <SocialCard platform="Facebook" caption={currentOutput.social_captions.facebook} />
                      )}
                      {currentOutput.social_captions.twitter && (
                        <SocialCard platform="Twitter" caption={currentOutput.social_captions.twitter} />
                      )}
                    </div>
                  </div>
                )}

                {/* MLS submission */}
                <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-3">
                  <h3 className="font-display text-lg text-ink">MLS submission</h3>
                  <p className="font-sans text-sm text-stone">
                    Approve a version above, then submit to NCRMLS via Flexmls Spark API. This action requires your review — it is never automatic.
                  </p>
                  {mlsSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <p className="font-sans text-sm text-emerald-700">Submitted to MLS successfully.</p>
                    </div>
                  )}
                  {mlsError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="font-sans text-sm text-red-700">{mlsError}</p>
                    </div>
                  )}
                  <button
                    onClick={submitToMLS}
                    disabled={!canSubmitMLS || mlsPending}
                    className="px-4 py-2 bg-ink text-gilt font-sans text-sm font-medium rounded-md hover:bg-midnight transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {mlsPending ? "Submitting…" : "Submit to MLS →"}
                  </button>
                  {!approvedOutput && (
                    <p className="font-sans text-xs text-stone/60">Approve a version above to unlock MLS submission.</p>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
