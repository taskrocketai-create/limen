import Link from "next/link";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Not found — Limen" };

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink text-parchment flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <Logo size={56} variant="primary" />
        </div>

        <div className="space-y-3">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-gilt">
            Error 404
          </p>
          <h1 className="font-display text-5xl text-parchment leading-none">
            The threshold is closed
          </h1>
          <p className="font-sans text-sm text-stone leading-relaxed pt-2">
            The page you were looking for isn&apos;t here — it may have moved,
            been archived, or never existed to begin with.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="font-sans text-sm bg-gilt text-ink px-6 py-3 hover:opacity-90 transition-opacity"
          >
            Return to dashboard
          </Link>
          <Link
            href="/"
            className="font-sans text-xs text-stone hover:text-parchment transition-colors pt-2"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
