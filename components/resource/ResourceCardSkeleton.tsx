/**
 * Loading placeholder that mirrors ResourceCard's polaroid anatomy exactly:
 * rounded-xl card, padded white frame, aspect-square cover — so the grid does
 * not visibly reflow or "flash" when real cards replace these skeletons.
 * Colors follow the theme variables like the real card.
 */
export default function ResourceCardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-bg)] shadow-sm">
      {/* Square cover — polaroid frame (matches ResourceCard) */}
      <div className="w-full bg-[var(--card-bg)] p-2 sm:p-2.5">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--accent-soft)] animate-pulse">
          {/* Free / discount badge skeleton */}
          <div className="absolute left-2 top-2 h-6 w-14 animate-pulse rounded-md bg-[var(--accent-soft-2)]" />

          {/* Wishlist heart skeleton */}
          <div className="absolute right-2.5 top-2.5 h-9 w-9 animate-pulse rounded-full bg-[var(--accent-soft-2)]" />
        </div>
      </div>

      {/* Info (matches ResourceCard's p-3 sm:p-4 info column) */}
      <div className="flex flex-grow flex-col gap-1 p-3 sm:p-4">
        {/* Category skeleton */}
        <div className="h-2.5 w-14 animate-pulse rounded bg-[var(--accent-soft-2)]" />

        {/* Title skeleton */}
        <div className="h-3.5 w-full animate-pulse rounded bg-[var(--accent-soft-2)] sm:h-4" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-[var(--accent-soft-2)] sm:h-4" />

        {/* Author skeleton */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--accent-soft-2)]" />
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--accent-soft-2)]" />
        </div>

        {/* Rating skeleton */}
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-3 animate-pulse rounded bg-[var(--accent-soft-2)]" />
            ))}
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--accent-soft-2)]" />
        </div>

        {/* Price line skeleton */}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5">
          <div className="flex flex-col gap-1">
            <div className="h-3 w-12 animate-pulse rounded bg-[var(--accent-soft-2)]" />
            <div className="h-5 w-16 animate-pulse rounded bg-[var(--accent-soft-2)] sm:h-6" />
          </div>
          <div className="h-7 w-14 animate-pulse rounded-md bg-[var(--accent-soft-2)] sm:h-8 sm:w-16" />
        </div>
      </div>
    </div>
  );
}
