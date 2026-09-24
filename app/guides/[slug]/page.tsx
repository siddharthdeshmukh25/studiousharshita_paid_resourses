import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { GUIDES, getGuide } from '@/lib/guides';
import { LEGAL_ENTITY, SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';

type GuidePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return { title: 'Guide not found', robots: { index: false, follow: false } };
  }

  const canonicalPath = `/guides/${guide.slug}`;

  return {
    title: guide.metaTitle,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'article',
      url: canonicalPath,
      title: guide.title,
      description: guide.description,
      siteName: SITE_NAME,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [LEGAL_ENTITY],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const relatedGuides = GUIDES.filter((item) => item.slug !== guide.slug).slice(0, 2);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: siteUrl(`/guides/${guide.slug}`),
    mainEntityOfPage: { '@type': 'WebPage', '@id': siteUrl(`/guides/${guide.slug}`) },
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    inLanguage: 'en-IN',
    keywords: guide.keywords.join(', '),
    articleSection: guide.category,
    author: { '@type': 'Person', name: LEGAL_ENTITY, url: siteUrl('/about') },
    publisher: {
      '@type': 'EducationalOrganization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Study Guides', item: siteUrl('/guides') },
      { '@type': 'ListItem', position: 3, name: guide.title, item: siteUrl(`/guides/${guide.slug}`) },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#6B6257]">
            <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <Link href="/guides" className="hover:text-[var(--accent)]">Study Guides</Link>
          </nav>

          <article>
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{guide.category}</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1A1A1A] sm:text-4xl">{guide.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6B6257]">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {LEGAL_ENTITY}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {guide.readingMinutes} min read
                </span>
                <span>Updated {dateFormatter.format(new Date(guide.updatedAt))}</span>
              </div>
              <p className="mt-6 border-l-4 border-[var(--accent)] pl-4 text-lg leading-relaxed text-[#4A443B]">{guide.excerpt}</p>
            </header>

            <div className="mt-8 space-y-8">
              {guide.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">{section.heading}</h2>
                  <div className="space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="leading-relaxed text-[#4A443B]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-3 list-disc space-y-2 pl-6 text-[#4A443B]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="leading-relaxed">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>

          <section className="mt-12 rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-6">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Put this into practice</h2>
            <p className="mt-2 leading-relaxed text-[#4A443B]">
              Browse our digital study notes and planners, or start with the free resources to see whether our note format fits
              how you study.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/resources?type=free"
                className="inline-block rounded-lg border-2 border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-soft)]"
              >
                Browse free resources
              </Link>
              <Link
                href="/resources?type=paid"
                className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-deep)]"
              >
                Shop premium notes
              </Link>
            </div>
          </section>

          {relatedGuides.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">More study guides</h2>
              <ul className="mt-4 space-y-3">
                {relatedGuides.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/guides/${related.slug}`}
                      className="block rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-4 transition-colors hover:border-[var(--accent)]"
                    >
                      <span className="block font-semibold text-[#1A1A1A]">{related.title}</span>
                      <span className="mt-1 block text-sm text-[#6B6257]">{related.excerpt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--line)]">
            <p className="text-sm text-[#6B6257]">Last updated: {dateFormatter.format(new Date(guide.updatedAt))}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
