function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-[var(--accent-soft-2)] ${className}`} />;
}

export default function ResourcesBrowserSkeleton() {
  return (
    <section className="min-h-[60vh] flex-1 py-9 sm:py-12" role="status" aria-label="Loading resources">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-7 w-64 max-w-full" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SkeletonBlock className="h-10 w-full sm:w-48" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-10 w-14" />
              <SkeletonBlock className="h-10 w-32" />
              <SkeletonBlock className="h-10 w-28" />
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-3 sm:mb-8 sm:p-4">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl sm:h-12 sm:w-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-52 max-w-full" />
            <SkeletonBlock className="h-3 w-full max-w-xl" />
          </div>
          <SkeletonBlock className="h-9 w-24 shrink-0 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-2 min-[600px]:grid-cols-3 lg:gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <article key={index} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[#FFFDF8]">
              <SkeletonBlock className="aspect-square w-full rounded-none" />
              <div className="space-y-2.5 p-3 sm:p-4">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-5 w-16" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
