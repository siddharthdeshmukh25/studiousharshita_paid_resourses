import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy — Digital Study Resources',
  description:
    'How Studious Harshita delivers digital study resources: instant dashboard access, Google Drive delivery, timelines and what to do if a download fails.',
  alternates: { canonical: '/shipping-policy' },
  openGraph: {
    type: 'website',
    url: '/shipping-policy',
    title: 'Shipping & Delivery Policy | Studious Harshita',
    description: 'Delivery details for digital study resources — instant access, timelines and support.',
  },
};

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Shipping &amp; Delivery Policy</h1>

          <div className="space-y-6 text-[#4A443B]">
            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">1. Digital Products Only</h2>
              <p className="leading-relaxed text-justify">
                Studious Harshita, operated by Harshita Pravinbhai Soni, sells exclusively digital products — study notes,
                planners, dashboards and downloadable resources. No physical goods are shipped, so no shipping charges apply
                to any order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">2. Delivery Method</h2>
              <p className="leading-relaxed text-justify">
                All purchases are delivered digitally through two channels:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong>Instant dashboard access</strong> — the resource is unlocked in your account dashboard the moment your payment succeeds.</li>
                <li><strong>Google Drive delivery</strong> — paid resources are shared to your email via Google Drive for lifetime access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">3. Delivery Timeline</h2>
              <p className="leading-relaxed text-justify">
                Delivery is instant for the vast majority of orders — access begins within seconds of a successful payment.
                In rare cases where manual verification is required (for example, a mismatched payment record), delivery is
                completed within 24 hours. If you have not received access within 24 hours of payment, contact support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">4. Failed or Delayed Delivery</h2>
              <p className="leading-relaxed text-justify">
                If a download fails, a Drive link does not arrive, or the file appears corrupted, write to us with your order
                details and we will restore access or provide a fresh link. Persistent delivery failures are eligible for a
                refund under our Cancellation &amp; Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">5. Requirements</h2>
              <p className="leading-relaxed text-justify">
                You need a stable internet connection, a Google account (for Drive delivery) and a PDF reader or Notion
                account (for dashboard templates), depending on the product. File formats are listed on each product page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">6. Contact Information</h2>
              <div className="mt-2 space-y-2 text-[#4A443B]">
                <p><strong>Legal Entity Name:</strong> Harshita Pravinbhai Soni</p>
                <p><strong>Email:</strong> support@studiousharshita.com</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--line)]">
            <p className="text-sm text-[#6B6257]">Last updated: September 19, 2026</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
