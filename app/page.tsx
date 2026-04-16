import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";

export const metadata = { title: "Limen — AI-powered listing copy for realtors" };

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-parchment flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Wordmark size={36} variant="primary" />
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="font-sans text-sm text-stone hover:text-parchment transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="font-sans text-sm bg-gilt text-ink px-5 py-2 hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-gilt mb-8">
          AI copywriting for real estate
        </p>
        <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-parchment leading-none mb-8 max-w-4xl">
          Listings that open&nbsp;doors
        </h1>
        <p className="font-sans text-base text-stone max-w-xl mb-12 leading-relaxed">
          Limen turns homeowner stories into compelling MLS descriptions, social
          captions, and headlines — in seconds. Send the intake link, review the
          copy, publish.
        </p>
        <Link
          href="/signup"
          className="font-sans text-sm bg-gilt text-ink px-8 py-4 hover:opacity-90 transition-opacity"
        >
          Start your first listing
        </Link>
      </section>

      {/* Feature strip */}
      <section className="border-t border-stone/20 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone/20">
        {[
          {
            label: "Intake link",
            body: "Send homeowners a private link. They share the story of their home — you get structured gold.",
          },
          {
            label: "AI copy generation",
            body: "Claude synthesises intake responses into MLS descriptions, headlines, and social captions tailored to the property.",
          },
          {
            label: "One-click MLS submit",
            body: "Review, approve, and push directly to Flexmls via the Spark API. No copy-paste.",
          },
        ].map(({ label, body }) => (
          <div key={label} className="px-8 py-12">
            <h3 className="font-display text-xl text-gilt mb-3">{label}</h3>
            <p className="font-sans text-sm text-stone leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-stone/20 px-8 py-6 flex items-center justify-between">
        <span className="font-sans text-xs text-stone">
          &copy; {new Date().getFullYear()} Limen
        </span>
        <Link
          href="/login"
          className="font-sans text-xs text-stone hover:text-parchment transition-colors"
        >
          Sign in
        </Link>
      </footer>
    </main>
  );
}
