const Line = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`} />
);

export default function CheckoutSkeleton() {
  return (
    <div className="academic-surface min-h-screen animate-pulse">
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <Line className="h-4 w-32" />
          <Line className="h-9 w-72 max-w-full" />
          <Line className="h-4 w-96 max-w-full" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <Line className="mb-5 h-6 w-40" />
              <div className="flex gap-5">
                <div className="h-24 w-24 rounded-xl bg-slate-200 md:h-28 md:w-28" />
                <div className="flex-1 space-y-3">
                  <Line className="h-6 w-28 rounded-full" />
                  <Line className="h-6 w-3/4" />
                  <Line className="h-4 w-1/2" />
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <Line className="mb-5 h-6 w-40" />
              <div className="flex gap-3">
                <Line className="h-12 flex-1 rounded-lg" />
                <Line className="h-12 w-28 rounded-lg" />
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <Line className="mb-5 h-6 w-44" />
              <Line className="h-16 w-full rounded-xl" />
              <Line className="mt-6 h-14 w-full rounded-xl" />
            </section>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <Line className="mb-5 h-6 w-40" />
              <div className="space-y-3">
                <Line className="h-5 w-full" />
                <Line className="h-5 w-3/4" />
                <Line className="h-5 w-1/2" />
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <Line className="mb-5 h-6 w-40" />
              <div className="space-y-4">
                <Line className="h-14 w-full rounded-xl" />
                <Line className="h-14 w-full rounded-xl" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}