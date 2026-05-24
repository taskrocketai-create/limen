"use client";

export interface ListingStyle {
  tone: string;
  launch_angle: string;
  social_style: string;
  notes: string;
}

const TONES = [
  { id: "clean_professional", label: "Clean & Professional", desc: "Polished, precise, agent-forward" },
  { id: "warm_inviting", label: "Warm & Inviting", desc: "Conversational, emotional, story-driven" },
  { id: "luxury_elevated", label: "Luxury / Elevated", desc: "Restrained, refined, aspirational" },
  { id: "modern_minimal", label: "Modern & Minimal", desc: "Short sentences, bold statements" },
  { id: "local_southern_charm", label: "Local Southern Charm", desc: "Community-first, neighborly, authentic" },
  { id: "investor_practical", label: "Investor / Practical", desc: "Numbers-forward, ROI-focused, direct" },
];

const LAUNCH_ANGLES = [
  { id: "feature_first", label: "Feature-first", desc: "Lead with the home's best physical feature" },
  { id: "lifestyle_first", label: "Lifestyle-first", desc: "Lead with how it feels to live there" },
  { id: "location_first", label: "Location-first", desc: "Lead with neighborhood and proximity" },
  { id: "value_first", label: "Value-first", desc: "Lead with price, updates, and move-in readiness" },
  { id: "story_first", label: "Story-first", desc: "Lead with the homeowner's experience" },
  { id: "visual_first", label: "Visual-first", desc: "Lead with what you see in the photos" },
];

const SOCIAL_STYLES = [
  { id: "just_listed", label: "Just Listed", desc: "Classic launch announcement" },
  { id: "new_to_market", label: "New to Market", desc: "Fresh inventory angle" },
  { id: "local_favorite", label: "Local Favorite", desc: "Neighborhood pride angle" },
  { id: "open_house_push", label: "Open House Push", desc: "Drive showing attendance" },
  { id: "hidden_gem", label: "Hidden Gem", desc: "Undersold, underpriced, underexposed" },
  { id: "price_value_alert", label: "Price / Value Alert", desc: "Value and affordability angle" },
  { id: "visual_tour", label: "Visual Tour", desc: "Photo-forward, room-by-room feel" },
  { id: "agent_voice", label: "Agent Voice", desc: "Personal, first-person agent perspective" },
];

interface StyleSelectorProps {
  value: ListingStyle;
  onChange: (style: ListingStyle) => void;
  onGenerate: () => void;
  generating: boolean;
  hasOutputs: boolean;
}

function OptionCard({
  id, label, desc, selected, onClick
}: {
  id: string; label: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 border rounded-lg transition-all ${
        selected
          ? "border-gilt bg-gilt/5 ring-1 ring-gilt"
          : "border-stone/20 bg-white hover:border-gilt/40"
      }`}
    >
      <div className="font-sans text-sm font-medium text-ink">{label}</div>
      <div className="font-sans text-xs text-stone mt-0.5">{desc}</div>
    </button>
  );
}

export default function StyleSelector({ value, onChange, onGenerate, generating, hasOutputs }: StyleSelectorProps) {
  const set = (key: keyof ListingStyle, val: string) => onChange({ ...value, [key]: val });

  return (
    <div className="bg-white border border-stone/20 rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-ink">Choose your listing style</h3>
          <p className="font-sans text-xs text-stone mt-0.5">These choices shape sentence structure, rhythm, and angle — not just word swaps.</p>
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">Tone</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TONES.map((t) => (
            <OptionCard
              key={t.id}
              id={t.id}
              label={t.label}
              desc={t.desc}
              selected={value.tone === t.id}
              onClick={() => set("tone", t.id)}
            />
          ))}
        </div>
      </div>

      {/* Launch Angle */}
      <div className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">Launch Angle</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LAUNCH_ANGLES.map((a) => (
            <OptionCard
              key={a.id}
              id={a.id}
              label={a.label}
              desc={a.desc}
              selected={value.launch_angle === a.id}
              onClick={() => set("launch_angle", a.id)}
            />
          ))}
        </div>
      </div>

      {/* Social Style */}
      <div className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">Social Post Style</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOCIAL_STYLES.map((s) => (
            <OptionCard
              key={s.id}
              id={s.id}
              label={s.label}
              desc={s.desc}
              selected={value.social_style === s.id}
              onClick={() => set("social_style", s.id)}
            />
          ))}
        </div>
      </div>

      {/* Optional notes */}
      <div className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">
          Anything else? <span className="normal-case tracking-normal text-stone/50">(optional)</span>
        </p>
        <textarea
          value={value.notes}
          onChange={(e) => set("notes", e.target.value.slice(0, 400))}
          placeholder="e.g. The seller is a retired teacher who loved the school proximity. Emphasize the quiet street."
          rows={2}
          className="w-full border border-stone/20 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-gilt resize-none rounded-md"
        />
        <p className="font-sans text-xs text-stone/40 text-right">{value.notes.length}/400</p>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={generating || !value.tone || !value.launch_angle || !value.social_style}
        className="w-full bg-ink text-gilt py-3 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating
          ? "Generating…"
          : hasOutputs
          ? "Regenerate with this style"
          : "Generate listing package"}
      </button>

      {(!value.tone || !value.launch_angle || !value.social_style) && (
        <p className="font-sans text-xs text-stone/50 text-center -mt-4">
          Select a tone, launch angle, and social style to generate
        </p>
      )}
    </div>
  );
}

