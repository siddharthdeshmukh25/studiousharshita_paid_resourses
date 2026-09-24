/**
 * Editorial loading skeleton for the resource detail page. Mirrors the real
 * page's structure (gallery + details + reviews). Every placeholder uses ONE
 * single uniform color (--accent-soft-2) so the skeleton reads as a calm,
 * consistent block instead of a patchwork of different shades.
 */
export default function ResourceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar placeholder */}
      <div className="h-14 sm:h-16 border-b border-[var(--line)] bg-[#FAF6EF]/90" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Gallery column */}
          <div>
            <div className="aspect-square w-full rounded-2xl bg-[var(--accent-soft-2)]" />
            <div className="mt-3 flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-[var(--accent-soft-2)]" />
              ))}
            </div>
          </div>

          {/* Details column */}
          <div>
            <div className="h-4 w-24 rounded-full bg-[var(--accent-soft-2)]" />
            <div className="mt-4 h-9 w-4/5 rounded bg-[var(--accent-soft-2)]" />
            <div className="mt-2 h-9 w-3/5 rounded bg-[var(--accent-soft-2)]" />
            <div className="mt-5 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-5 w-5 rounded-full bg-[var(--accent-soft-2)]" />
              ))}
              <div className="h-4 w-20 rounded bg-[var(--accent-soft-2)]" />
            </div>

            {/* Price / CTA card */}
            <div className="mt-6 rounded-2xl p-5 bg-[var(--accent-soft-2)]/50">
              <div className="h-8 w-28 rounded bg-[var(--accent-soft-2)]" />
              <div className="mt-3 h-4 w-40 rounded bg-[var(--accent-soft-2)]" />
              <div className="mt-5 h-12 w-full rounded-full bg-[var(--accent-soft-2)]" />
              <div className="mt-2.5 h-12 w-full rounded-full bg-[var(--accent-soft-2)]" />
            </div>

            {/* Description lines */}
            <div className="mt-6 space-y-2.5">
              <div className="h-4 w-full rounded bg-[var(--accent-soft-2)]" />
              <div className="h-4 w-11/12 rounded bg-[var(--accent-soft-2)]" />
              <div className="h-4 w-4/6 rounded bg-[var(--accent-soft-2)]" />
            </div>
          </div>
        </div>

        {/* Reviews strip */}
        <div className="mt-10 space-y-3">
          <div className="h-5 w-32 rounded bg-[var(--accent-soft-2)]" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 bg-[var(--accent-soft-2)]/50">
              <div className="h-4 w-36 rounded bg-[var(--accent-soft-2)]" />
              <div className="mt-2.5 h-3.5 w-3/4 rounded bg-[var(--accent-soft-2)]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
