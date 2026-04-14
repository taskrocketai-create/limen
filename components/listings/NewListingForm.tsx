"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import type { PropertyType } from "@/types/database";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
const STEPS = [
  { number: 1, label: "Property" },
  { number: 2, label: "Details" },
  { number: 3, label: "Homeowner" },
] as const;

type Step = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  // Step 1 — property basics
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  property_type: PropertyType | "";
  price: string;
  // Step 2 — property details
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  lot_size: string;
  year_built: string;
  // Step 3 — homeowner contact (for intake invite)
  homeowner_name: string;
  homeowner_email: string;
  homeowner_phone: string;
  send_intake_now: boolean;
}

const INITIAL: FormState = {
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  property_type: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  lot_size: "",
  year_built: "",
  homeowner_name: "",
  homeowner_email: "",
  homeowner_phone: "",
  send_intake_now: false,
};

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "land", label: "Land" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------
const inputCls =
  "w-full px-3 py-2.5 bg-white border border-stone/20 rounded-md font-sans text-sm text-ink placeholder:text-stone/40 focus:outline-none focus:border-gilt focus:ring-1 focus:ring-gilt transition-colors";
const labelCls = "block font-sans text-xs font-medium text-stone mb-1";
const errorCls = "font-sans text-xs text-red-600 mt-1";

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-medium transition-colors ${
                step.number < current
                  ? "bg-gilt text-ink"
                  : step.number === current
                  ? "bg-ink text-gilt border-2 border-gilt"
                  : "bg-stone/10 text-stone"
              }`}
            >
              {step.number < current ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`font-sans text-xs ${
                step.number === current ? "text-ink font-medium" : "text-stone"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-16 sm:w-24 mx-2 mb-4 transition-colors ${
                step.number < current ? "bg-gilt" : "bg-stone/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateStep(step: Step, form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.address_line1.trim()) errors.address_line1 = "Address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.state) errors.state = "State is required.";
    if (!form.zip.trim()) errors.zip = "ZIP code is required.";
    else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) errors.zip = "Enter a valid ZIP code.";
  }
  if (step === 3) {
    if (!form.homeowner_name.trim()) errors.homeowner_name = "Homeowner name is required.";
    if (form.send_intake_now && !form.homeowner_email.trim())
      errors.homeowner_email = "Email is required to send the intake link.";
    if (form.homeowner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.homeowner_email))
      errors.homeowner_email = "Enter a valid email address.";
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function NewListingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[field as string];
      return next;
    });
  }

  function next() {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => (s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    startTransition(async () => {
      setServerError("");
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line1: form.address_line1.trim(),
          address_line2: form.address_line2.trim() || null,
          city: form.city.trim(),
          state: form.state,
          zip: form.zip.trim(),
          property_type: form.property_type || null,
          price: form.price ? parseFloat(form.price.replace(/,/g, "")) : null,
          bedrooms: form.bedrooms ? parseFloat(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
          sqft: form.sqft ? parseInt(form.sqft, 10) : null,
          lot_size: form.lot_size.trim() || null,
          year_built: form.year_built ? parseInt(form.year_built, 10) : null,
          homeowner_name: form.homeowner_name.trim(),
          homeowner_email: form.homeowner_email.trim() || null,
          homeowner_phone: form.homeowner_phone.trim() || null,
          send_intake_now: form.send_intake_now,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      const { id } = await res.json();
      router.push(`/listings/${id}`);
    });
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Nav */}
      <header className="bg-ink border-b border-stone/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} variant="primary" label="Limen" />
            <span className="font-display text-gilt text-lg tracking-wide">Limen</span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="font-sans text-xs text-stone hover:text-parchment transition-colors"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Title */}
        <div>
          <h1 className="font-display text-4xl text-ink">New listing</h1>
          <p className="font-sans text-sm text-stone mt-1">
            Fill in the property details. You can always edit later.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Form card */}
        <div className="bg-white border border-stone/20 rounded-lg p-6 sm:p-8 space-y-6">

          {/* ── Step 1: Property ── */}
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl text-ink">Property address</h2>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Street address *</label>
                  <input
                    className={inputCls}
                    placeholder="123 Main Street"
                    value={form.address_line1}
                    onChange={(e) => set("address_line1", e.target.value)}
                    autoComplete="street-address"
                  />
                  {errors.address_line1 && <p className={errorCls}>{errors.address_line1}</p>}
                </div>

                <div>
                  <label className={labelCls}>Unit / Suite (optional)</label>
                  <input
                    className={inputCls}
                    placeholder="Apt 4B"
                    value={form.address_line2}
                    onChange={(e) => set("address_line2", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>City *</label>
                    <input
                      className={inputCls}
                      placeholder="Wilmington"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                    {errors.city && <p className={errorCls}>{errors.city}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <select
                      className={inputCls}
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                    >
                      <option value="">—</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className={errorCls}>{errors.state}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>ZIP *</label>
                    <input
                      className={inputCls}
                      placeholder="28401"
                      value={form.zip}
                      onChange={(e) => set("zip", e.target.value)}
                      maxLength={10}
                    />
                    {errors.zip && <p className={errorCls}>{errors.zip}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Property type</label>
                    <select
                      className={inputCls}
                      value={form.property_type}
                      onChange={(e) => set("property_type", e.target.value)}
                    >
                      <option value="">Select type</option>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>List price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-stone">$</span>
                      <input
                        className={`${inputCls} pl-7`}
                        placeholder="450,000"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <>
              <h2 className="font-display text-2xl text-ink">Property details</h2>
              <p className="font-sans text-sm text-stone -mt-2">
                These feed directly into AI copy generation — the more detail, the better.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Bedrooms</label>
                    <input
                      className={inputCls}
                      placeholder="3"
                      value={form.bedrooms}
                      onChange={(e) => set("bedrooms", e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bathrooms</label>
                    <input
                      className={inputCls}
                      placeholder="2.5"
                      value={form.bathrooms}
                      onChange={(e) => set("bathrooms", e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Year built</label>
                    <input
                      className={inputCls}
                      placeholder="1998"
                      value={form.year_built}
                      onChange={(e) => set("year_built", e.target.value)}
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Square footage</label>
                    <input
                      className={inputCls}
                      placeholder="2,100"
                      value={form.sqft}
                      onChange={(e) => set("sqft", e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Lot size</label>
                    <input
                      className={inputCls}
                      placeholder="0.34 acres"
                      value={form.lot_size}
                      onChange={(e) => set("lot_size", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Homeowner ── */}
          {step === 3 && (
            <>
              <h2 className="font-display text-2xl text-ink">Homeowner details</h2>
              <p className="font-sans text-sm text-stone -mt-2">
                A private intake link will be generated. You can send it now or later.
              </p>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Homeowner name *</label>
                  <input
                    className={inputCls}
                    placeholder="Jane Smith"
                    value={form.homeowner_name}
                    onChange={(e) => set("homeowner_name", e.target.value)}
                    autoComplete="name"
                  />
                  {errors.homeowner_name && <p className={errorCls}>{errors.homeowner_name}</p>}
                </div>

                <div>
                  <label className={labelCls}>Homeowner email</label>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="jane@example.com"
                    value={form.homeowner_email}
                    onChange={(e) => set("homeowner_email", e.target.value)}
                    autoComplete="email"
                  />
                  {errors.homeowner_email && <p className={errorCls}>{errors.homeowner_email}</p>}
                </div>

                <div>
                  <label className={labelCls}>Homeowner phone (optional)</label>
                  <input
                    className={inputCls}
                    type="tel"
                    placeholder="(910) 555-0100"
                    value={form.homeowner_phone}
                    onChange={(e) => set("homeowner_phone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                {/* Send now toggle */}
                <label className="flex items-start gap-3 p-4 border border-stone/20 rounded-md cursor-pointer hover:border-gilt/40 transition-colors group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.send_intake_now}
                      onChange={(e) => set("send_intake_now", e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-stone/30 rounded peer-checked:bg-gilt peer-checked:border-gilt transition-colors flex items-center justify-center">
                      {form.send_intake_now && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#1A1814" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">
                      Send intake link immediately
                    </p>
                    <p className="font-sans text-xs text-stone mt-0.5">
                      The homeowner will receive an email with their private intake link. Requires an email address above.
                    </p>
                  </div>
                </label>

                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="font-sans text-sm text-red-700">{serverError}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation buttons */}
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

          {step < 3 ? (
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
              {isPending ? "Creating…" : "Create listing →"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
