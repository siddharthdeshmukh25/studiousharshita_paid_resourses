import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Page Not Found (404)',
  description: 'The page you are looking for does not exist. Explore free study guides and premium notes instead.',
};

const POPULAR_LINKS = [
  { href: '/resources', label: 'Browse Resources', icon: BookOpen },
  { href: '/guides', label: 'Study Guides', icon: Compass },
  { href: '/support', label: 'Support', icon: Search },
];

/**
 * Branded 404: keeps the chrome (navbar/footer) so lost users can recover
 * instead of hitting a bare error page. Suggests guides so the visit still
 * ends somewhere useful.
 */
export default function NotFound() {
  const suggested = GUIDES.slice(0, 2);

  return (
    <div className="academic-surface flex min-h-screen flex-col">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        {/* Decorative glows, matching the home hero */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[var(--accent)]/10" style={{ filter: 'blur(56px)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-[var(--sage)]/10" style={{ filter: 'blur(56px)' }} />

        <div className="relative w-full max-w-xl text-center">
          <p className="font-serif text-[88px] italic leading-none text-[var(--accent)] sm:text-[120px]" aria-hidden="true">
            404
          </p>
          <h1 className="mt-2 font-serif text-3xl italic leading-tight text-[#0F172A] sm:text-4xl">
            This page skipped class.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#64748B] sm:text-base">
            The page you are looking for does not exist or may have moved. Let us get you back to the
            study material that matters.
          </p>

          {/* Primary actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/resources"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-deep)] hover:shadow-lg sm:w-auto"
            >
              <BookOpen className="h-4 w-4" />
              Browse Resources
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[#FFFDF8] px-6 py-3.5 text-sm font-bold text-[#0F172A] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] sm:w-auto"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Popular destinations */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {POPULAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#334155] shadow-sm transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Suggested guides */}
          <div className="mt-10 rounded-2xl border border-[#E2E8F0] bg-[#FFFDF8]/80 p-5 text-left shadow-sm backdrop-blur sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Meanwhile, try a free guide
            </p>
            <div className="mt-3 space-y-3">
              {suggested.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3 transition-colors hover:bg-[var(--accent-soft)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F172A] group-hover:text-[var(--accent)] transition-colors">
                      {guide.title}
                    </p>
                    <p className="text-xs text-[#64748B]">{guide.readingMinutes} min read</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8] transition-colors group-hover:text-[var(--accent)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
