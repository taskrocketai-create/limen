"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const QUESTIONS = [
  {
    id: "market_focus",
    question: "What best describes your market focus?",
    subtitle: "This shapes the tone and positioning of your marketing.",
    options: [
      { value: "luxury", label: "Luxury & High-End", desc: "Premium properties, affluent buyers" },
      { value: "first_time", label: "First-Time Buyers", desc: "Entry-level, educational, supportive" },
      { value: "investors", label: "Investors & Investment", desc: "ROI-focused, numbers-driven" },
      { value: "relocation", label: "Relocation", desc: "Out-of-area buyers, corporate moves" },
      { value: "rural_land", label: "Rural & Land", desc: "Acreage, farms, rural lifestyle" },
      { value: "all_range", label: "All Price Ranges", desc: "Full-service, community-focused" },
    ],
  },
  {
    id: "agent_style",
    question: "How would your best clients describe working with you?",
    subtitle: "Be honest — this is what makes your brand authentic.",
    options: [
      { value: "warm_personal", label: "Warm & Personal", desc: "Like working with a trusted friend" },
      { value: "sharp_professional", label: "Sharp & Professional", desc: "Efficient, knowledgeable, precise" },
      { value: "bold_results", label: "Bold & Results-Driven", desc: "Aggressive negotiator, gets it done" },
      { value: "calm_trustworthy", label: "Calm & Trustworthy", desc: "Steady hand, no pressure" },
      { value: "energetic_enthusiastic", label: "Energetic & Enthusiastic", desc: "High energy, always available" },
      { value: "local_expert", label: "The Local Expert", desc: "Deep community roots and knowledge" },
    ],
  },
  {
    id: "market_area",
    question: "What best describes your primary market area?",
    subtitle: "Your location shapes the visual style of your marketing.",
    options: [
      { value: "urban_city", label: "Urban / City", desc: "Downtown, condos, walkable neighborhoods" },
      { value: "suburban", label: "Suburban Neighborhoods", desc: "Family communities, good schools" },
      { value: "small_town", label: "Small Town", desc: "Close-knit, community pride" },
      { value: "rural_coastal", label: "Rural / Coastal", desc: "Land, waterfront, lifestyle properties" },
      { value: "mixed", label: "Mixed Market", desc: "I work across multiple area types" },
    ],
  },
  {
    id: "ideal_client",
    question: "Who is your ideal client?",
    subtitle: "Not who you work with — who you want more of.",
    options: [
      { value: "young_professionals", label: "Young Professionals", desc: "Late 20s–40s, career-focused buyers" },
      { value: "growing_families", label: "Growing Families", desc: "Space, schools, neighborhoods" },
      { value: "retirees_downsizers", label: "Retirees & Downsizers", desc: "Simplifying, equity-rich sellers" },
      { value: "investors_landlords", label: "Investors & Landlords", desc: "Portfolio builders, cash buyers" },
      { value: "move_up_buyers", label: "Move-Up Buyers", desc: "Second home, upsizing families" },
      { value: "everyone", label: "Everyone — I love all clients", desc: "Full-service community agent" },
    ],
  },
  {
    id: "marketing_word",
    question: "Pick one word that should describe every piece of your marketing.",
    subtitle: "Trust your gut — your first instinct is usually right.",
    options: [
      { value: "elegant", label: "Elegant", desc: "Refined, timeless, premium feel" },
      { value: "confident", label: "Confident", desc: "Bold, assertive, commanding" },
      { value: "friendly", label: "Friendly", desc: "Approachable, warm, genuine" },
      { value: "modern", label: "Modern", desc: "Clean, current, forward-looking" },
      { value: "authoritative", label: "Authoritative", desc: "Expert, trusted, established" },
      { value: "fresh", label: "Fresh", desc: "Energetic, new perspective, vibrant" },
    ],
  },
];

interface BrandAnswers {
  market_focus: string;
  agent_style: string;
  market_area: string;
  ideal_client: string;
  marketing_word: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=intro, 1-5=questions, 6=logo, 7=headshot, 8=generating, 9=done
  const [answers, setAnswers] = useState<Partial<BrandAnswers>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const headshotRef = useRef<HTMLInputElement>(null);

  const totalSteps = QUESTIONS.length + 3; // intro + questions + logo + headshot
  const progress = Math.round((step / totalSteps) * 100);

  function handleAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => setStep(s => s + 1), 300);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleHeadshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeadshotFile(file);
    setHeadshotPreview(URL.createObjectURL(file));
  }

  async function handleFinish() {
    setStep(8); // generating
    setGenerating(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, logoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      // Upload headshot if provided
      let headshotUrl: string | null = null;
      if (headshotFile) {
        const ext = headshotFile.name.split(".").pop();
        const path = `${user.id}/headshot.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(path, headshotFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
          headshotUrl = urlData.publicUrl;
        }
      }

      // Generate brand profile via AI
      const res = await fetch("/api/brand/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, logoUrl }),
      });

      const brandProfile = await res.json();

      // Save everything to profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("profiles")
        .update({
          onboarding_completed: true,
          brand_profile: brandProfile,
          logo_url: logoUrl,
          headshot_url: headshotUrl,
        })
        .eq("id", user.id);

      setStep(9);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep(7);
    } finally {
      setGenerating(false);
    }
  }

  // Progress bar
  const ProgressBar = () => (
    <div className="w-full bg-stone/20 h-0.5 mb-12">
      <div
        className="h-0.5 bg-gilt transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  // Intro
  if (step === 0) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-3">
            <p className="font-sans text-xs tracking-widest uppercase text-gilt/60">Welcome to Limen</p>
            <h1 className="font-serif text-5xl text-parchment">Let&apos;s build your brand.</h1>
            <p className="font-sans text-base text-stone leading-relaxed">
              Answer 5 quick questions and we&apos;ll generate a complete marketing brand profile for your listings — colors, style, tone, and design. Takes about 3 minutes.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-gilt text-ink py-4 font-sans text-sm tracking-widest uppercase hover:bg-parchment transition-colors"
            >
              Build my brand →
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full text-stone/50 font-sans text-xs hover:text-stone transition-colors py-2"
            >
              Skip for now — I&apos;ll do this later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Questions 1-5
  const questionIndex = step - 1;
  if (step >= 1 && step <= QUESTIONS.length) {
    const q = QUESTIONS[questionIndex];
    return (
      <div className="min-h-screen bg-ink px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <ProgressBar />
          <div className="space-y-2">
            <p className="font-sans text-xs tracking-widest uppercase text-gilt/60">
              Question {step} of {QUESTIONS.length}
            </p>
            <h2 className="font-serif text-4xl text-parchment leading-tight">{q.question}</h2>
            <p className="font-sans text-sm text-stone">{q.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt) => {
              const selected = answers[q.id as keyof BrandAnswers] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  className={`text-left p-4 border transition-all ${
                    selected
                      ? "border-gilt bg-gilt/10"
                      : "border-stone/20 hover:border-gilt/50 hover:bg-white/5"
                  }`}
                >
                  <p className="font-sans text-sm font-medium text-parchment mb-1">{opt.label}</p>
                  <p className="font-sans text-xs text-stone">{opt.desc}</p>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="font-sans text-xs text-stone/40 hover:text-stone transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Logo upload
  if (step === QUESTIONS.length + 1) {
    return (
      <div className="min-h-screen bg-ink px-6 py-12">
        <div className="max-w-lg mx-auto space-y-8">
          <ProgressBar />
          <div className="space-y-2">
            <p className="font-sans text-xs tracking-widest uppercase text-gilt/60">Almost done</p>
            <h2 className="font-serif text-4xl text-parchment">Upload your logo.</h2>
            <p className="font-sans text-sm text-stone leading-relaxed">
              PNG with transparent background works best. Your logo will appear on every listing card, flyer, and open house visual. No logo? Skip — you can add it later in Settings.
            </p>
          </div>

          <div
            onClick={() => logoRef.current?.click()}
            className="border border-dashed border-stone/30 p-10 text-center cursor-pointer hover:border-gilt/50 transition-colors"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo preview" className="max-h-24 mx-auto object-contain" />
            ) : (
              <div className="space-y-3">
                <p className="font-sans text-stone text-sm">Click to upload your logo</p>
                <p className="font-sans text-xs text-stone/40">PNG, SVG, JPG · Max 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-gilt text-ink py-3 font-sans text-xs tracking-widest uppercase hover:bg-parchment transition-colors"
            >
              {logoFile ? "Continue →" : "Skip logo →"}
            </button>
          </div>
          <button
            onClick={() => setStep(s => s - 1)}
            className="font-sans text-xs text-stone/40 hover:text-stone transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Headshot upload
  if (step === QUESTIONS.length + 2) {
    return (
      <div className="min-h-screen bg-ink px-6 py-12">
        <div className="max-w-lg mx-auto space-y-8">
          <ProgressBar />
          <div className="space-y-2">
            <p className="font-sans text-xs tracking-widest uppercase text-gilt/60">One more thing</p>
            <h2 className="font-serif text-4xl text-parchment">Add your headshot.</h2>
            <p className="font-sans text-sm text-stone leading-relaxed">
              Agents with photos on their marketing get significantly more responses. Your headshot appears on flyers and property sheets. Square crop works best.
            </p>
          </div>

          <div
            onClick={() => headshotRef.current?.click()}
            className="border border-dashed border-stone/30 p-10 text-center cursor-pointer hover:border-gilt/50 transition-colors"
          >
            {headshotPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headshotPreview} alt="Headshot preview" className="w-32 h-32 mx-auto object-cover rounded-full" />
            ) : (
              <div className="space-y-3">
                <div className="w-24 h-24 mx-auto rounded-full bg-stone/20 flex items-center justify-center">
                  <span className="text-stone/40 text-3xl">👤</span>
                </div>
                <p className="font-sans text-stone text-sm">Click to upload your photo</p>
                <p className="font-sans text-xs text-stone/40">JPG, PNG · Max 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={headshotRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeadshotChange}
          />

          {error && <p className="font-sans text-xs text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleFinish}
              disabled={generating}
              className="flex-1 bg-gilt text-ink py-3 font-sans text-xs tracking-widest uppercase hover:bg-parchment transition-colors disabled:opacity-50"
            >
              {generating ? "Building your brand…" : headshotFile ? "Finish setup →" : "Skip & finish →"}
            </button>
          </div>
          <button
            onClick={() => setStep(s => s - 1)}
            className="font-sans text-xs text-stone/40 hover:text-stone transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Generating
  if (step === 8) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-2 border-gilt border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="font-serif text-3xl text-parchment">Building your brand.</h2>
            <p className="font-sans text-sm text-stone">Analyzing your answers and generating your marketing profile…</p>
          </div>
        </div>
      </div>
    );
  }

  // Done
  if (step === 9) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-3">
            <p className="font-sans text-xs tracking-widest uppercase text-gilt/60">You&apos;re all set</p>
            <h2 className="font-serif text-5xl text-parchment">Your brand is ready.</h2>
            <p className="font-sans text-sm text-stone leading-relaxed">
              Every listing card, flyer, open house visual, and social post will now use your brand automatically. Create your first listing to see it in action.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gilt text-ink py-4 font-sans text-sm tracking-widest uppercase hover:bg-parchment transition-colors"
          >
            Go to dashboard →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
