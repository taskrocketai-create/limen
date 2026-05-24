"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";
import StatusBadge from "@/components/ui/StatusBadge";
import PhotoUploader from "@/components/listings/output/PhotoUploader";
import PlatformPanel from "@/components/listings/output/PlatformPanel";
import StyleSelector, { type ListingStyle } from "@/components/listings/output/StyleSelector";
import OpenHousePanel from "@/components/listings/output/OpenHousePanel";
import type { ListingStatus, PropertyType } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AiOutput {
  id: string;
  version: number;
  listing_description: string | null;
  headline_variants: string[] | null;
  social_captions: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
    nextdoor?: string;
  } | null;
  platform_content: {
    mls?: { description: string; agent_remarks: string; highlights: string[] };
    zillow?: { description: string; highlights: string[]; what_i_love: string };
    realtor_com?: { description: string; highlights: string[] };
    google?: { post: string };
  } | null;
  generated_at: string;
  approved: boolean;
  approved_at: string | null;
  locked: boolean;
  locked_at: string | null;
  compliance_notes?: string | null;
}

interface ListingDetail {
  highlights: string[] | null;
  recent_updates: string | null;
  neighborhood_notes: string | null;
  hoa_details: string | null;
  seller_notes: string | null;
}

interface Photo {
  id: string;
  url: string;
  path: string;
  sort_order: number;
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
  photos: Photo[];
  ai_outputs: AiOutput[];
  listing_locked: boolean;
  packages_used: number;
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
// Main component
// ---------------------------------------------------------------------------
export default function ListingOutputClient(props: ListingOutputClientProps) {
  const {
    id, address_line1, city, state, zip,
    price, bedrooms, bathrooms, sqft, status,
    intake_token, intake_sent_at, intake_completed_at,
    listing_details, photos, ai_outputs,
    listing_locked, packages_used: initialPackagesUsed,
  } = props;

  const [, startTransition] = useTransition();
  const [outputs, setOutputs] = useState<AiOutput[]>(ai_outputs);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [packagesUsed, setPackagesUsed] = useState(initialPackagesUsed);
  const isLocked = listing_locked;
  const [listingStyle, setListingStyle] = useState<ListingStyle>({
    tone: "",
    launch_angle: "",
    social_style: "",
    notes: "",
  });
  const [activeVersion, setActiveVersion] = useState<string | null>(
    ai_outputs.length > 0 ? ai_outputs[0].id : null
  );
  const [approving, setApproving] = useState(false);
  const [mlsPending, setMlsPending] = useState(false);
  const [mlsError, setMlsError] = useState("");
  const [mlsSuccess, setMlsSuccess] = useState(false);
  const [intakeCopied, setIntakeCopied] = useState(false);

  const currentOutput = outputs.find((o) => o.id === activeVersion) ?? outputs[0] ?? null;
  const intakeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/intake/${intake_token}`;

  // ── Generate AI copy ──────────────────────────────────────────────────────
  function generateCopy() {
    setGenerating(true);
    setGenError("");
    startTransition(async () => {
      const res = await fetch(`/api/listings/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: listingStyle }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setGenError(b.error ?? "Generation failed. Please try again.");
        setGenerating(false);
        return;
      }
      const data = await res.json();
      const newOutput: AiOutput = {
        ...data,
        platform_content: data.platform_content ?? null,
        locked: false,
        locked_at: null,
        compliance_notes: data.compliance_notes ?? null,
      };
      setOutputs((prev) => [newOutput, ...prev]);
      setActiveVersion(newOutput.id);
      setGenerating(false);
    });
  }

  // ── Approve output ────────────────────────────────────────────────────────
  function approveOutput() {
    if (!currentOutput) return;
    setShowConfirmModal(false);
    setApproving(true);
    startTransition(async () => {
      const res = await fetch(`/api/listings/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_id: currentOutput.id }),
      });
      const data = await res.json().catch(() => ({}));
      setOutputs((prev) =>
        prev.map((o) =>
          o.id === currentOutput.id
            ? { ...o, approved: true, approved_at: new Date().toISOString(), locked: true, locked_at: new Date().toISOString() }
            : o
        )
      );
      if (data.packages_used) setPackagesUsed(data.packages_used);
      setApproving(false);
    });
  }

  // ── Copy intake link ──────────────────────────────────────────────────────
  function copyIntakeLink() {
    navigator.clipboard.writeText(intakeUrl);
    setIntakeCopied(true);
    setTimeout(() => setIntakeCopied(false), 2000);
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

  const canGenerate = !isLocked && (status === "intake_received" || status === "ai_ready" || status === "reviewed");
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
          <StatusBadge status={isLocked ? "submitted" : status} />
          {isLocked && (
            <span className="font-sans text-xs bg-ink text-gilt px-2 py-1 rounded">
              🔒 Locked
            </span>
          )}
          <span className="font-sans text-xs text-stone hidden sm:block">
            {packagesUsed}/20 packages
          </span>
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

            {/* Photo uploader */}
            <PhotoUploader listingId={id} initialPhotos={photos} />

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

            {/* Style selector + generate */}
            {!isLocked && canGenerate && (
              <StyleSelector
                value={listingStyle}
                onChange={setListingStyle}
                onGenerate={generateCopy}
                generating={generating}
                hasOutputs={outputs.length > 0}
              />
            )}

            {isLocked && (
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-ink">Listing copy</h2>
                <span className="font-sans text-xs text-stone bg-parchment border border-stone/20 px-4 py-2 rounded-md">
                  🔒 Locked — create a Refresh Package to make changes
                </span>
              </div>
            )}

            {!isLocked && !canGenerate && (
              <h2 className="font-display text-3xl text-ink">Listing copy</h2>
            )}

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

                {/* Version selector */}
                {outputs.length > 1 && (
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl text-ink">Listing copy</h3>
                    <select
                      className="font-sans text-xs text-stone border border-stone/20 rounded px-2 py-1.5 focus:outline-none focus:border-gilt bg-white"
                      value={activeVersion ?? ""}
                      onChange={(e) => { setActiveVersion(e.target.value); }}
                    >
                      {outputs.map((o) => (
                        <option key={o.id} value={o.id}>
                          v{o.version}{o.approved ? " ✓ Approved" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Compliance badge — shown when copy is generated */}
                {!currentOutput.locked && currentOutput.compliance_notes && (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <span className="text-emerald-600 text-lg flex-shrink-0">🏠</span>
                    <div>
                      <p className="font-sans text-xs font-medium text-emerald-800">Fair Housing Reviewed</p>
                      <p className="font-sans text-xs text-emerald-700 mt-0.5">{currentOutput.compliance_notes}</p>
                    </div>
                  </div>
                )}

                {/* Approval bar */}
                <div className="flex items-center justify-between p-3 bg-white border border-stone/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    {currentOutput.locked ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-ink" />
                        <span className="font-sans text-sm text-ink font-medium">🔒 Approved & Locked</span>
                      </>
                    ) : currentOutput.approved ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-sans text-sm text-emerald-700 font-medium">Approved</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-stone/30" />
                        <span className="font-sans text-sm text-stone">Draft</span>
                      </>
                    )}
                    <span className="font-sans text-xs text-stone/50 ml-2">v{currentOutput.version}</span>
                  </div>
                  {!currentOutput.locked && !isLocked && (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={approving}
                      className="px-4 py-2 bg-ink text-gilt font-sans text-xs font-medium rounded-md hover:bg-gilt hover:text-ink transition-colors disabled:opacity-60 tracking-wide"
                    >
                      {approving ? "Approving…" : "Approve & Lock Listing"}
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
                      <div>
                        <h3 className="font-display text-lg text-ink">Listing description</h3>
                        <p className="font-sans text-xs text-stone/60 mt-0.5">
                          {currentOutput.listing_description.length} characters
                          {currentOutput.listing_description.length <= 500
                            ? " · MLS ready ✓"
                            : currentOutput.listing_description.length <= 1000
                            ? " · Within typical MLS limits"
                            : " · May exceed some MLS character limits"}
                        </p>
                      </div>
                      <CopyButton text={currentOutput.listing_description} />
                    </div>
                    <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">
                      {currentOutput.listing_description}
                    </p>
                  </div>
                )}

                {/* Platform publish panel */}
                <PlatformPanel
                  social_captions={currentOutput.social_captions}
                  platform_content={currentOutput.platform_content}
                  photos={photos}
                  address={`${address_line1}, ${city}, ${state} ${zip}`}
                />

                {/* Open House Package */}
                <OpenHousePanel
                  listingId={id}
                  address={`${address_line1}, ${city}, ${state} ${zip}`}
                  photos={photos}
                />

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

      {/* Usage meter */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone/20 px-6 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-stone">Approved listing packages this month</span>
          <div className="flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-2 rounded-sm ${i < packagesUsed ? "bg-gilt" : "bg-stone/20"}`}
              />
            ))}
          </div>
          <span className="font-sans text-xs font-medium text-ink">{packagesUsed} / 20</span>
        </div>
        <div className="flex items-center gap-4">
          {packagesUsed >= 20 && (
            <span className="font-sans text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
              Additional packages $5 each
            </span>
          )}
          <Link href="/disclaimer" className="font-sans text-xs text-stone/40 hover:text-stone transition-colors">
            Disclaimer & Legal
          </Link>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 px-4">
          <div className="bg-parchment max-w-md w-full p-8 space-y-6">
            <div>
              <h2 className="font-serif text-2xl text-ink mb-3">Approve this listing package?</h2>
              <p className="font-sans text-sm text-stone leading-relaxed">
                Once approved, this listing package will be <strong className="text-ink">locked</strong>, counted toward your monthly limit, and can no longer be edited or regenerated. To make changes after approval, you will need to create a new listing package.
              </p>
            </div>
            <div className="bg-white border border-stone/20 p-4 space-y-2">
              <div className="flex justify-between font-sans text-sm">
                <span className="text-stone">Packages used this month</span>
                <span className="text-ink font-medium">{packagesUsed} / 20</span>
              </div>
              <div className="flex justify-between font-sans text-sm">
                <span className="text-stone">After approval</span>
                <span className="text-gilt font-medium">{packagesUsed + 1} / 20</span>
              </div>
              {packagesUsed >= 20 && (
                <div className="flex justify-between font-sans text-sm border-t border-stone/20 pt-2">
                  <span className="text-stone">Additional package charge</span>
                  <span className="text-ink font-medium">$5.00</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-stone/30 text-stone font-sans text-xs tracking-widest uppercase py-3 hover:border-ink hover:text-ink transition-colors"
              >
                Go Back to Editing
              </button>
              <button
                onClick={approveOutput}
                className="flex-1 bg-ink text-gilt font-sans text-xs tracking-widest uppercase py-3 hover:bg-gilt hover:text-ink transition-colors"
              >
                Approve & Lock Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
