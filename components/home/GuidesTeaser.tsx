import Link from 'next/link';
import { Clock } from 'lucide-react';
import { GUIDES } from '@/lib/guides';

/**
 * Server component: "from my desk" — the editorial blog teaser. Guide links
 * are present in the initial HTML so crawlers and AI answer engines without
 * JavaScript can still discover every guide from the homepage.
 */

const BLOG_CATEGORIES = ['STUDY', 'PRODUCTIVITY', 'AI', 'CAREER', 'CREATOR LIFE', 'STUDENT LIFE'];

const CATEGORY_STYLES = [
  'bg-[var(--sage-soft)] text-[var(--accent-deep)]',
  'bg-[var(--butter-soft)] text-[#8A6D1F]',
  'bg-[var(--sky-soft)] text-[#3E5E96]',
  'bg-[var(--blush-soft)] text-[#A05450]',
  'bg-[var(--clay-soft)] text-[#96602F]',
  'bg-[var(--accent-soft-2)] text-[var(--accent-deep)]',
];

export default function GuidesTeaser() {
  const featured = GUIDES.slice(0, 3);

  return (
    <section className="border-t border-[var(--line)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">the blog</p>
            <h2 className="font-serif-display mt-1 text-3xl italic text-[#1A1A1A] sm:text-4xl">from my desk</h2>
          </div>
          <Link href="/guides" className="shrink-0 text-sm font-bold text-[var(--accent)] hover:underline">
            All posts →
          </Link>
        </div>

        {/* Category chips — editorial labels */}
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Blog categories">
          {BLOG_CATEGORIES.map((category, index) => (
            <span
              key={category}
              className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${CATEGORY_STYLES[index % CATEGORY_STYLES.length]}`}
            >
              {category}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:gap-5">
          {featured.map((guide, index) => (
            <article
              key={guide.slug}
              className={`group relative flex flex-col rounded-2xl border border-[var(--line)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(26,26,26,0.10)] ${
                ['bg-[var(--sky-soft)]', 'bg-[var(--blush-soft)]', 'bg-[var(--butter-soft)]'][index % 3]
              }`}
            >
              <span aria-hidden="true" className="tape absolute -top-2.5 left-6 h-5 w-16 rotate-[-4deg]" />
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6257]">
                <Clock className="h-3 w-3" />
                {guide.readingMinutes} min read
              </p>
              <h3 className="font-serif-display mt-3 text-2xl italic leading-tight text-[#1A1A1A]">
                <Link href={`/guides/${guide.slug}`} className="transition-colors hover:text-[var(--accent)]">
                  {guide.title}
                </Link>
              </h3>
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[#4A443B]">{guide.excerpt}</p>
              <Link
                href={`/guides/${guide.slug}`}
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1A1A1A] underline decoration-[var(--accent)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--accent)]"
              >
                Read the post →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
