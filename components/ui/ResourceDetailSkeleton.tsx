const Line = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`} />
);

function ResourceHeaderSkeleton() {
  return (
    <header className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-200" />
            <Line className="hidden h-5 w-32 min-[390px]:block" />
          </div>
          <Line className="hidden h-10 max-w-xl flex-1 md:block" />
          <Line className="h-9 w-20 rounded-lg" />
        </div>
        <div className="pb-3 md:hidden"><Line className="h-10 w-full rounded-lg" /></div>
      </div>
    </header>
  );
}

export default function ResourceDetailSkeleton() {
  return (
    <div className="academic-surface min-h-screen animate-pulse">
      <ResourceHeaderSkeleton />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square w-full overflow-hidden bg-slate-200" />
          </section>

          <section className="space-y-3">
            <div className="space-y-3">
              <Line className="h-7 w-24 rounded-full" />
              <Line className="h-8 w-4/5 sm:h-10" />
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-5 w-5 rounded bg-slate-200" />
                  ))}
                </div>
                <Line className="h-4 w-28" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div className="space-y-2">
                  <Line className="h-8 w-24 sm:h-10" />
                  <Line className="h-4 w-16" />
                </div>
                <div className="h-9 w-9 rounded-lg bg-slate-200" />
              </div>
              <Line className="h-12 w-full rounded-lg" />
              <Line className="mx-auto mt-4 h-4 w-52 max-w-full" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <Line className="mb-4 h-6 w-36" />
              <div className="space-y-2.5">
                <Line className="h-4 w-full" />
                <Line className="h-4 w-11/12" />
                <Line className="h-4 w-3/4" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-6 lg:col-start-1">
            <div className="mb-4 flex items-center justify-between">
              <Line className="h-6 w-32" />
              <Line className="h-9 w-32 rounded-lg" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2"><Line className="h-4 w-28" /><Line className="h-3 w-20" /></div>
                    <Line className="h-3 w-16" />
                  </div>
                  <Line className="mt-4 h-3 w-full" />
                  <Line className="mt-2 h-3 w-4/5" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
