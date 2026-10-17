import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Line = ({ className = '' }: { className?: string }) => (
  <div aria-hidden="true" className={`rounded-md bg-[var(--accent-soft-2)] ${className}`} />
);

export default function CheckoutSkeleton() {
  return (
    <div className="academic-surface flex min-h-screen flex-col">
      <Navbar />
      <main className="min-h-[60vh] w-full flex-1 py-8 sm:py-12" role="status" aria-label="Loading checkout">
        <div className="mx-auto w-full max-w-5xl animate-pulse px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <Line className="h-4 w-32" />
            <Line className="h-9 w-72 max-w-full" />
            <Line className="h-4 w-96 max-w-full" />
          </div>

          <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <section className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 sm:p-6">
                <Line className="mb-5 h-6 w-40" />
                <div className="flex gap-4 sm:gap-5">
                  <Line className="h-20 w-20 shrink-0 rounded-xl sm:h-28 sm:w-28" />
                  <div className="flex-1 space-y-3">
                    <Line className="h-6 w-28 rounded-full" />
                    <Line className="h-6 w-3/4" />
                    <Line className="h-4 w-1/2" />
                  </div>
                </div>
              </section>
              <section className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 sm:p-6">
                <Line className="mb-5 h-6 w-40" />
                <div className="flex gap-3">
                  <Line className="h-12 flex-1 rounded-lg" />
                  <Line className="h-12 w-28 rounded-lg" />
                </div>
              </section>
              <section className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 sm:p-6">
                <Line className="mb-5 h-6 w-44" />
                <Line className="h-16 w-full rounded-xl" />
                <Line className="mt-6 h-14 w-full rounded-xl" />
              </section>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 sm:p-6">
                <Line className="mb-5 h-6 w-40" />
                <div className="space-y-3">
                  <Line className="h-5 w-full" />
                  <Line className="h-5 w-3/4" />
                  <Line className="h-5 w-1/2" />
                </div>
              </section>
              <section className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 sm:p-6">
                <Line className="mb-5 h-6 w-40" />
                <div className="space-y-4">
                  <Line className="h-14 w-full rounded-xl" />
                  <Line className="h-14 w-full rounded-xl" />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
