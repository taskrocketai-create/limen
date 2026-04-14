"use client";

import { useState, useTransition } from "react";
import Logo from "@/components/brand/Logo";

type Step = 1 | 2 | 3 | 4;

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
  // Photo uploads (file objects — uploaded via signed URL separately)
  photos: File[];
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
        <Logo size={56} variant="primary" />
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
          <StepDots current={step} total={4} />
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
            {step === 1 && "What makes your home special?"}
            {step === 2 && "Any recent updates?"}
            {step === 3 && "Tell us about the neighbourhood."}
            {step === 4 && "Anything else we should know?"}
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

              {serverError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-sans text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <p className="font-sans text-xs text-stone">
                By submitting, you agree that this information will be used to generate your home&apos;s listing description.
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

          {step < 4 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 bg-ink text-gilt font-sans text-sm font-medium rounded-md hover:bg-midnight transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isPending}
              className="px-6 py-2.5 bg-gilt text-ink font-sans text-sm font-medium rounded-md hover:bg-gilt/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Submitting…" : "Submit →"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
