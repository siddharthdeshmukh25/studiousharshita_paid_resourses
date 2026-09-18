import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { GUIDES } from '@/lib/guides';
import { SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free Study Guides for Students in Ahmedabad & India',
  description:
    'Free, practical study guides from Studious Harshita: build a study plan, take better notes, revise for board exams and choose the study material that actually helps.',
  keywords: [
    'free study guides',
    'study tips for students India',
    'exam revision guide',
    'study resources Ahmedabad',
    'how to study effectively',
  ],
  alternates: { canonical: '/guides' },
  openGraph: {
    type: 'website',
    url: '/guides',
    title: `Free Study Guides | ${SITE_NAME}`,
    description:
      'Practical guides on study plans, note-taking, board exam revision and choosing study material, written for Indian school and college students.',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Free Study Guides | ${SITE_NAME}`,
    description:
      'Practical guides on study plans, note-taking, board exam revision and choosing study material for Indian students.',
  },
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GuidesHub() {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Study Guides',
    description:
      'Practical study guides on planning, note-taking, revision and study resources for Indian school and college students.',
    url: siteUrl('/guides'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/guides/${guide.slug}`,
        name: guide.title,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <JsonLd data={itemListSchema} />

      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#6B6257]">
            <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span className="text-[#4A443B]">Study Guides</span>
          </nav>

          <header className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Learn with {SITE_NAME}</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
              Free Study Guides for Students in Ahmedabad &amp; Across India
            </h1>
            <p className="mt-4 leading-relaxed text-[#4A443B]">
              Everything here is written from our own teaching and note-making work with school students (classes 5th to 12th),
              college students and competitive exam aspirants. No fluff, no filler: each guide gives you a method you can start
              using in the next study session.
            </p>
          </header>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {GUIDES.map((guide) => (
              <article
                key={guide.slug}
                className="flex h-full flex-col rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  <span>{guide.category}</span>
                  <span className="flex items-center gap-1 text-[#6B6257] normal-case tracking-normal">
                    <Clock className="h-3.5 w-3.5" />
                    {guide.readingMinutes} min read
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-[#1A1A1A]">
                  <Link href={`/guides/${guide.slug}`} className="hover:text-[var(--accent)] transition-colors">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 leading-relaxed text-[#4A443B]">{guide.excerpt}</p>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  Read the guide
                  <span aria-hidden="true">→</span>
                </Link>
                <p className="mt-3 text-xs text-[#6B6257]">Updated {dateFormatter.format(new Date(guide.updatedAt))}</p>
              </article>
            ))}
          </div>

          <section className="mt-12 rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#1A1A1A]">
              <BookOpen className="h-5 w-5 text-[var(--accent)]" />
              Ready-made study material
            </h2>
            <p className="mt-3 leading-relaxed text-[#4A443B]">
              If you would rather not build your own summaries, our digital study notes map the syllabus chapter by chapter, with
              formula sheets and revision pages ready for exam week. Start with the free resources on our home page to see
              whether the format suits you.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-deep)]"
            >
              Browse study resources
            </Link>
          </section>

          <div className="mt-8 pt-6 border-t border-[var(--line)]">
            <p className="text-sm text-[#6B6257]">Last updated: September 17, 2026</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
