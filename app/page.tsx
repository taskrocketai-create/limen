import Logo, { Wordmark } from "@/components/brand/Logo";

const sizes = [16, 24, 32, 48, 64, 96, 128, 256, 512];

export default function Home() {
  return (
    <main className="min-h-screen bg-parchment p-12 space-y-16">
      <h1 className="font-display text-4xl text-ink">Limen — Logo test</h1>

      {/* Primary: gilt on ink */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-stone">Primary (gilt on ink)</h2>
        <div className="flex flex-wrap items-end gap-6">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Logo size={s} variant="primary" />
              <span className="font-sans text-xs text-stone">{s}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Inverted: ink on gilt */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-stone">Inverted (ink on gilt)</h2>
        <div className="flex flex-wrap items-end gap-6">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Logo size={s} variant="inverted" />
              <span className="font-sans text-xs text-stone">{s}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bare: mark only on parchment */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-stone">Bare (on parchment)</h2>
        <div className="flex flex-wrap items-end gap-6 bg-parchment p-6">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Logo size={s} variant="bare" />
              <span className="font-sans text-xs text-stone">{s}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Wordmark */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-stone">Wordmark</h2>
        <div className="flex flex-wrap items-end gap-6">
          <Wordmark size={24} variant="primary" />
          <Wordmark size={32} variant="primary" />
          <Wordmark size={48} variant="primary" />
          <Wordmark size={64} variant="primary" />
        </div>
        <div className="flex flex-wrap items-end gap-6 mt-4">
          <Wordmark size={24} variant="inverted" />
          <Wordmark size={32} variant="inverted" />
          <Wordmark size={48} variant="inverted" />
          <Wordmark size={64} variant="inverted" />
        </div>
      </section>

      {/* Font specimens */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-stone">Font check</h2>
        <p className="font-display text-5xl text-ink">The threshold for listings</p>
        <p className="font-display italic text-3xl text-gilt">Cormorant Garamond — display</p>
        <p className="font-sans text-base text-ink">DM Sans — UI body copy. 123 Main St, Wilmington NC 28401.</p>
        <p className="font-sans text-sm text-stone">Small UI text. Filter · Search · Status badges.</p>
      </section>
    </main>
  );
}
