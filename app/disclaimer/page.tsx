import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Disclaimer — Educational Content',
  description:
    'Disclaimer for Studious Harshita: educational content provided as-is, no guaranteed exam results, external links and fair-use notes on study resources.',
  alternates: { canonical: '/disclaimer' },
  openGraph: {
    type: 'website',
    url: '/disclaimer',
    title: 'Disclaimer | Studious Harshita',
    description: 'Educational content disclaimer for Studious Harshita — results, external links and usage terms.',
  },
};

export default function Disclaimer() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Disclaimer</h1>

          <div className="space-y-6 text-[#4A443B]">
            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">1. General Information</h2>
              <p className="leading-relaxed text-justify">
                The content on Studious Harshita — operated by Harshita Pravinbhai Soni — is published in good faith and for
                general educational and informational purposes only. While we work hard to keep every resource accurate and
                syllabus-mapped, we make no warranties about the completeness, reliability or accuracy of the material.
                Any action you take based on the information found here is strictly at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">2. No Guaranteed Results</h2>
              <p className="leading-relaxed text-justify">
                Study outcomes depend on individual effort, consistency and exam conditions. Our notes, planners and tools are
                aids — they do not guarantee specific marks, ranks, selections, scholarship awards or admissions. Testimonials
                reflect individual experiences and are not a promise of results.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">3. Not Professional Advice</h2>
              <p className="leading-relaxed text-justify">
                Content related to scholarships, careers, applications or productivity is not professional, legal or financial
                advice. Scholarship details (deadlines, funding, eligibility) change frequently — always verify with the
                official scholarship provider before applying.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">4. External Links</h2>
              <p className="leading-relaxed text-justify">
                Our resources may link to external websites, tools and resources. We do not control and are not responsible
                for the content, availability or privacy practices of third-party sites. Visiting external links is at your
                own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">5. AI Tools & Templates</h2>
              <p className="leading-relaxed text-justify">
                Articles about AI tools and our Notion templates are recommendations, not endorsements or affiliations unless
                explicitly stated. Tool features and pricing are set by their respective providers and may change without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">6. Consent & Updates</h2>
              <p className="leading-relaxed text-justify">
                By using this website, you consent to this disclaimer and agree to its terms. We may update this disclaimer at
                any time; changes are posted on this page. Questions? Contact us at{' '}
                <a href="mailto:support@studiousharshita.com" className="text-[var(--accent)] hover:underline">support@studiousharshita.com</a>.
              </p>
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
