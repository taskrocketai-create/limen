"use client";

import { useState, useTransition } from "react";
import Logo from "@/components/brand/Logo";

type Step = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Highlight chips — Step 1
// ---------------------------------------------------------------------------
const HIGHLIGHT_OPTIONS = [
  "Open floor plan",
  "Natural light",
  "Updated kitchen",
  "Hardwood floors",
  "Large backyard",
  "Primary suite",
  "Home office",
  "Two-car garage",
  "Screened porch",
  "Vaulted ceilings",
  "Fireplace",
  "Walk-in closets",
  "Eat-in kitchen",
  "Formal dining room",
  "Finished basement",
  "Bonus room",
  "Cul-de-sac lot",
  "Corner lot",
  "Waterfront",
  "Golf course view",
  "Smart home",
  "Solar panels",
  "EV charger",
  "Pool / hot tub",
];

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface UploadedPhoto {
  localId: string;
  previewUrl: string;
  storagePath?: string;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
}

interface FormState {
  // Step 1
  highlights: string[];
  custom_highlight: string;
  // Step 2
  recent_updates: string;
  hoa_details: string;
  // Step 3
  neighborhood_notes: string;
  // Step 4
  seller_notes: string;
  // Step 5
  photos: UploadedPhoto[];
}

const INITIAL: FormState = {
  highlights: [],
  custom_highlight: "",
  recent_updates: "",
  hoa_details: "",
  neighborhood_notes: "",
  seller_notes: "",
  photos: [],
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const textareaCls =
  "w-full px-4 py-3 bg-white border border-stone/20 rounded-md font-sans text-sm text-ink placeholder:text-stone/40 focus:outline-none focus:border-gilt focus:ring-1 focus:ring-gilt transition-colors resize-none";
const labelCls = "block font-sans text-sm font-medium text-ink mb-2";
const hintCls = "font-sans text-xs text-stone mt-1";

const MAX_PHOTOS = 24;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Step progress — minimal, homeowner-friendly
// ---------------------------------------------------------------------------
function StepDots({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`rounded-full transition-all duration-300 ${
            n < current
              ? "w-2 h-2 bg-gilt"
              : n === current
              ? "w-3 h-3 bg-ink"
              : "w-2 h-2 bg-stone/30"
          }`}
        />
      ))}
      <span className="font-sans text-xs text-stone ml-2">
        Step {current} of {total}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight chip
// ---------------------------------------------------------------------------
function HighlightChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full font-sans text-sm border transition-colors ${
        selected
          ? "bg-ink text-gilt border-ink"
          : "bg-white text-stone border-stone/20 hover:border-stone/50"
      }`}
    >
      {selected && <span className="mr-1 text-xs">✓</span>}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------
function SuccessScreen({ address }: { address: string }) {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Logo size={56} variant="primary" />
        </div>
        <div className="w-16 h-16 rounded-full bg-gilt/20 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path d="M5 14L11 20L23 8" stroke="#C8A96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-4xl text-gilt">Thank you.</h1>
          <p className="font-sans text-sm text-stone mt-3">
            Your information for <span className="text-parchment">{address}</span> has been submitted. Your realtor will be in touch shortly.
          </p>
        </div>
        <p className="font-sans text-xs text-stone/50">
          You may close this window.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface HomeownerIntakeFormProps {
  token: string;
  address: string;
  listingId: string;
  alreadySubmitted: boolean;
}

export default function HomeownerIntakeForm({
  token,
  address,
  listingId,
  alreadySubmitted,
}: HomeownerIntakeFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");

  if (submitted) return <SuccessScreen address={address} />;

  function toggleHighlight(label: string) {
    setForm((f) => ({
      ...f,
      highlights: f.highlights.includes(label)
        ? f.highlights.filter((h) => h !== label)
        : [...f.highlights, label],
    }));
  }

  function addCustomHighlight() {
    const val = form.custom_highlight.trim();
    if (!val || form.highlights.includes(val)) return;
    setForm((f) => ({
      ...f,
      highlights: [...f.highlights, val],
      custom_highlight: "",
    }));
  }

  // Photo handling -----------------------------------------------------------
  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - form.photos.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);

    const newPhotos: UploadedPhoto[] = toUpload.map((file) => ({
      localId: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setForm((f) => ({ ...f, photos: [...f.photos, ...newPhotos] }));

    await Promise.all(
      toUpload.map(async (file, i) => {
        const localId = newPhotos[i].localId;

        if (file.size > MAX_PHOTO_BYTES) {
          setForm((f) => ({
            ...f,
            photos: f.photos.map((p) =>
              p.localId === localId
                ? { ...p, status: "error", errorMessage: "Too large (max 15 MB)" }
                : p
            ),
          }));
          return;
        }

        const body = new FormData();
        body.append("file", file);

        try {
          const res = await fetch(`/api/intake/${token}/upload`, {
            method: "POST",
            body,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? "Upload failed");
          }
          const { storage_path } = await res.json();
          setForm((f) => ({
            ...f,
            photos: f.photos.map((p) =>
              p.localId === localId
                ? { ...p, status: "done", storagePath: storage_path }
                : p
            ),
          }));
        } catch (err) {
          setForm((f) => ({
            ...f,
            photos: f.photos.map((p) =>
              p.localId === localId
                ? {
                    ...p,
                    status: "error",
                    errorMessage: err instanceof Error ? err.message : "Upload failed",
                  }
                : p
            ),
          }));
        }
      })
    );
  }

  function removePhoto(localId: string) {
    setForm((f) => {
      const photo = f.photos.find((p) => p.localId === localId);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return { ...f, photos: f.photos.filter((p) => p.localId !== localId) };
    });
  }

  function next() {
    setStep((s) => (s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    startTransition(async () => {
      setServerError("");
      const res = await fetch(`/api/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          highlights: form.highlights,
          recent_updates: form.recent_updates.trim() || null,
          hoa_details: form.hoa_details.trim() || null,
          neighborhood_notes: form.neighborhood_notes.trim() || null,
          seller_notes: form.seller_notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    });
  }

  const uploadingCount = form.photos.filter((p) => p.status === "uploading").length;
  const canSubmit = uploadingCount === 0 && !isPending;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Minimal header — no realtor dashboard chrome */}
      <header className="bg-ink">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Logo size={24} variant="primary" label="Limen" />
          <span className="font-display text-gilt text-base tracking-wide">Limen</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Intro */}
        <div className="space-y-2">
          <StepDots current={step} total={5} />
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            {step === 1 && "What makes your home special?"}
            {step === 2 && "Any recent updates?"}
            {step === 3 && "Tell us about the neighbourhood."}
            {step === 4 && "Anything else we should know?"}
            {step === 5 && "Add a few photos."}
          </h1>
          <p className="font-sans text-sm text-stone">{address}</p>
        </div>

        {/* Form card */}
        <div className="bg-white border border-stone/20 rounded-lg p-6 sm:p-8 space-y-6">

          {/* ── Step 1: Highlights ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  Select everything that describes your home
                </label>
                <p className={hintCls}>Choose as many as apply — or add your own below.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {HIGHLIGHT_OPTIONS.map((h) => (
                    <HighlightChip
                      key={h}
                      label={h}
                      selected={form.highlights.includes(h)}
                      onToggle={() => toggleHighlight(h)}
                    />
                  ))}
                </div>
              </div>

              {/* Custom highlight */}
              <div>
                <label className={labelCls}>Add a custom highlight</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2.5 bg-white border border-stone/20 rounded-md font-sans text-sm text-ink placeholder:text-stone/40 focus:outline-none focus:border-gilt focus:ring-1 focus:ring-gilt"
                    placeholder="e.g. Original oak mantlepiece"
                    value={form.custom_highlight}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, custom_highlight: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomHighlight())}
                  />
                  <button
                    type="button"
                    onClick={addCustomHighlight}
                    className="px-4 py-2.5 bg-ink text-gilt font-sans text-sm rounded-md hover:bg-midnight transition-colors"
                  >
                    Add
                  </button>
                </div>
                {/* User-added custom chips */}
                {form.highlights
                  .filter((h) => !HIGHLIGHT_OPTIONS.includes(h))
                  .length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.highlights
                      .filter((h) => !HIGHLIGHT_OPTIONS.includes(h))
                      .map((h) => (
                        <HighlightChip
                          key={h}
                          label={h}
                          selected
                          onToggle={() => toggleHighlight(h)}
                        />
                      ))}
                  </div>
                )}
              </div>

              {form.highlights.length > 0 && (
                <p className="font-sans text-xs text-gilt">
                  {form.highlights.length} highlight{form.highlights.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* ── Step 2: Updates ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  Recent updates or renovations
                </label>
                <p className={hintCls}>
                  New roof, kitchen remodel, HVAC, windows — anything in the last 10 years. Be specific about year and scope.
                </p>
                <textarea
                  className={`${textareaCls} mt-2`}
                  rows={5}
                  placeholder="e.g. 2022 – New architectural shingle roof. 2021 – Full kitchen renovation with quartz countertops and stainless appliances. 2019 – HVAC replaced."
                  value={form.recent_updates}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recent_updates: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className={labelCls}>HOA details (if applicable)</label>
                <p className={hintCls}>Monthly fee, what&apos;s included, name of association.</p>
                <textarea
                  className={`${textareaCls} mt-2`}
                  rows={3}
                  placeholder="e.g. Landfall HOA — $185/month. Includes lawn care, pool, tennis courts, and gated security."
                  value={form.hoa_details}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hoa_details: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Neighbourhood ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  What do you love about the neighbourhood?
                </label>
                <p className={hintCls}>
                  Think about proximity to schools, parks, restaurants, commute, community feel, walkability — anything that sold you on the location.
                </p>
                <textarea
                  className={`${textareaCls} mt-2`}
                  rows={7}
                  placeholder="e.g. We moved here for the top-rated Forest Hills Elementary just two blocks away. The neighbourhood has a true community feel — we know all our neighbours. Saturday farmers market is a 10-minute walk, and we're five minutes from Wrightsville Beach."
                  value={form.neighborhood_notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, neighborhood_notes: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Final notes ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  Anything else the buyer should know?
                </label>
                <p className={hintCls}>
                  This is your chance to speak directly to the next owner — favourite memories, hidden gems of the house, anything that doesn&apos;t fit neatly elsewhere.
                </p>
                <textarea
                  className={`${textareaCls} mt-2`}
                  rows={6}
                  placeholder="e.g. The sunroom catches perfect afternoon light — we've spent countless hours there. The garden in back was my project and has perennials that will bloom every spring. The neighbours on both sides are wonderful."
                  value={form.seller_notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seller_notes: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* ── Step 5: Photos ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Photos of your home (optional)</label>
                <p className={hintCls}>
                  Good photos help your realtor. Take bright, uncluttered shots of each main room — the living room, kitchen, primary bedroom, and any special features. Up to {MAX_PHOTOS} photos, 15 MB each.
                </p>
              </div>

              {/* Drop zone / picker */}
              <label
                htmlFor="photo-input"
                className="block border-2 border-dashed border-stone/30 rounded-lg p-8 text-center cursor-pointer hover:border-gilt transition-colors"
              >
                <input
                  id="photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    handlePhotoFiles(e.target.files);
                    e.target.value = "";
                  }}
                  disabled={form.photos.length >= MAX_PHOTOS}
                />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-stone" aria-hidden>
                  <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-sans text-sm font-medium text-ink">
                  {form.photos.length >= MAX_PHOTOS
                    ? `Maximum ${MAX_PHOTOS} photos reached`
                    : "Tap to select photos"}
                </p>
                <p className="font-sans text-xs text-stone mt-1">
                  JPEG, PNG, WebP, or HEIC
                </p>
              </label>

              {/* Uploaded previews */}
              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.photos.map((photo) => (
                    <div key={photo.localId} className="relative aspect-square rounded-md overflow-hidden bg-stone/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />

                      {photo.status === "uploading" && (
                        <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                          <svg className="animate-spin text-gilt" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}

                      {photo.status === "error" && (
                        <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center p-2">
                          <p className="font-sans text-[10px] text-white text-center leading-tight">
                            {photo.errorMessage ?? "Failed"}
                          </p>
                        </div>
                      )}

                      {photo.status === "done" && (
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-gilt flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#1A1814" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removePhoto(photo.localId)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-parchment opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                          <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadingCount > 0 && (
                <p className="font-sans text-xs text-stone">
                  Uploading {uploadingCount} photo{uploadingCount !== 1 ? "s" : ""}…
                </p>
              )}

              {serverError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-sans text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <p className="font-sans text-xs text-stone">
                By submitting, you agree that this information will be used to prepare your home&apos;s listing.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={back}
              disabled={isPending}
              className="font-sans text-sm text-stone hover:text-ink transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 bg-ink text-gilt font-sans text-sm font-medium rounded-md hover:bg-midnight transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-gilt text-ink font-sans text-sm font-medium rounded-md hover:bg-gilt/90 transition-colors disabled:opacity-60"
            >
              {isPending
                ? "Submitting…"
                : uploadingCount > 0
                ? "Waiting for uploads…"
                : "Submit →"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
