import Logo from "@/components/brand/Logo";

/**
 * Login page — auth UI will be wired in a later step.
 * Stub rendered now so middleware redirects don't 404.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Logo size={56} variant="primary" />
          <div className="text-center">
            <h1 className="font-display text-4xl text-gilt">Limen</h1>
            <p className="font-sans text-sm text-stone mt-1">The threshold for listings</p>
          </div>
        </div>

        <div className="bg-midnight border border-stone/20 rounded-lg p-6 space-y-4">
          <h2 className="font-display text-2xl text-parchment">Sign in</h2>
          <p className="font-sans text-sm text-stone">
            Auth will be configured once Supabase is connected.
          </p>
        </div>
      </div>
    </div>
  );
}
