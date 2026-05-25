"use client";

import Link from "next/link";

export default function OnboardingPrompt() {
  return (
    <div className="bg-ink border border-gilt/20 rounded-lg p-5 flex items-center justify-between gap-6 mb-6">
      <div className="space-y-1">
        <p className="font-serif text-lg text-gilt">Set up your brand</p>
        <p className="font-sans text-xs text-stone leading-relaxed">
          Answer 5 questions and Limen generates a custom marketing brand profile — colors, style, and design applied to every listing card, flyer, and social post automatically.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="flex-shrink-0 bg-gilt text-ink px-5 py-2.5 font-sans text-xs tracking-widest uppercase hover:bg-parchment transition-colors whitespace-nowrap"
      >
        Set up →
      </Link>
    </div>
  );
}
