'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, BookOpen, Check, Star } from 'lucide-react';
import { formatPrice, discountedPrice } from '@/lib/format';
import Reveal from '@/components/ui/Reveal';

interface Resource {
  _id: string;
  title: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

interface Stats {
  totalResources: number;
  totalStudents: number;
  avgRating: number;
}

/** "what can you find here?" — five pastel editorial cards. */
const CATEGORY_CARDS = [
  {
    id: '01',
    label: 'Free Resources',
    bg: 'bg-[var(--sage-soft)]',
    text: 'Study smarter, for free.',
    desc: 'Guides, templates, websites, scholarships, AI tools and resources curated for students.',
    cta: 'Explore Resources',
    href: '/resources',
    span: 'sm:col-span-2',
  },
  {
    id: '02',
    label: 'Digital Products',
    bg: 'bg-[var(--blush-soft)]',
    text: 'Tools for your next level.',
    desc: 'Notion dashboards, planners, trackers and digital resources designed to make life a little more organized.',
    cta: 'Shop Templates',
    href: '/resources?type=paid',
    span: 'sm:col-span-2',
  },
  {
    id: '03',
    label: 'Study & Productivity',
    bg: 'bg-[var(--sky-soft)]',
    text: 'Make your study life work for you.',
    desc: 'Study techniques, routines, productivity systems and realistic advice for students.',
    cta: 'Read the Guides',
    href: '/guides',
    span: 'sm:col-span-2',
  },
  {
    id: '04',
    label: 'AI for Students',
    bg: 'bg-[var(--butter-soft)]',
    text: 'Your study toolkit, upgraded.',
    desc: 'Discover AI tools that can help with studying, research, notes, planning and productivity.',
    cta: 'Explore AI Tools',
    href: '/guides',
    span: 'sm:col-span-3',
  },
  {
    id: '05',
    label: 'Creator Resources',
    bg: 'bg-[var(--clay-soft)]',
    text: 'For students who create.',
    desc: 'Content ideas, creator resources, tools and practical advice for building online.',
    cta: 'Explore Creator Hub',
    href: '/contact',
    span: 'sm:col-span-3',
  },
];

const TICKER_ITEMS = [
  'free study resources',
  'notion templates for students',
  'scholarship tracker',
  'ai tools for students',
  'study planners',
  'exam revision notes',
  'student productivity',
];

/**
 * Editorial home page top: magazine hero, keyword ticker, featured free/paid
 * resource rows and the pastel "what can you find here?" category cards.
 * All resource and stats data stays live from the existing APIs.
 */
export default function HomeLanding() {
  const router = useRouter();
  const [paidResources, setPaidResources] = useState<Resource[]>([]);
  const [freeResources, setFreeResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/resources?access=paid').then((res) => res.json()) as Promise<{ resources?: Resource[] }>,
      fetch('/api/resources?access=free').then((res) => res.json()) as Promise<{ resources?: Resource[] }>,
    ])
      .then(([paid, free]) => {
        if (!cancelled) {
          setPaidResources((paid.resources || []).slice(0, 8));
          setFreeResources((free.resources || []).slice(0, 8));
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching featured resources:', error);
        if (!cancelled) setLoading(false);
      });

    fetch('/api/stats')
      .then((res) => res.json())
      .then((data: Stats) => {
        if (!cancelled) setStats(data);
      })
      .catch((error) => console.error('Error fetching stats:', error));

    return () => { cancelled = true; };
  }, []);

  const featuredFree = freeResources.slice(0, 4);
  const featuredPaid = paidResources.slice(0, 4);
  const hasFeatured = featuredFree.length > 0 || featuredPaid.length > 0;

  // Live numbers from the API; friendly defaults while loading / on failure.
  const statsItems = [
    { value: `${Math.max(stats?.totalResources ?? 0, 0)}${stats ? '' : '+'}`, label: 'study resources' },
    { value: stats ? `${stats.totalStudents.toLocaleString('en-IN')}+` : 'growing', label: 'students helped' },
    { value: stats && stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : 'new', label: 'average rating' },
  ];

  // The flagship product the primary CTA points at; falls back to the grid.
  const winterArc = useMemo(
    () => paidResources.find((r) => r.title.toLowerCase().includes('winter arc')),
    [paidResources]
  );
  const primaryCtaHref = winterArc ? `/resource/${winterArc._id}` : '/resources?type=paid';

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden">
        {/* Graph-paper patch fading into the paper background */}
        <div
          aria-hidden="true"
          className="paper-grid pointer-events-none absolute inset-x-0 top-0 h-64 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        {/* Decorative pastel glows + scattered stars */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[var(--blush-soft)] opacity-70" style={{ filter: 'blur(48px)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[var(--sage-soft)] opacity-70" style={{ filter: 'blur(56px)' }} />
        <Star aria-hidden="true" className="pointer-events-none absolute left-[8%] top-16 h-4 w-4 rotate-12 fill-[var(--butter)] text-[var(--butter)]" />
        <Star aria-hidden="true" className="pointer-events-none absolute right-[12%] top-28 h-5 w-5 -rotate-12 fill-[var(--blush)] text-[var(--blush)]" />
        <Star aria-hidden="true" className="pointer-events-none absolute left-[45%] top-8 h-3 w-3 rotate-45 fill-[var(--sky)] text-[var(--sky)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
          {/* ---- Copy column ---- */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">
                <span aria-hidden="true" className="sticker-dot !h-6 !w-6 !rotate-0 !bg-[var(--blush)] !text-[13px] !shadow-none text-[#1A1A1A]">✷</span>
                the study corner of the internet
              </p>
              <h1 className="font-serif-display mt-4 text-[2.65rem] leading-[1.03] text-[#1A1A1A] sm:text-6xl lg:text-7xl">
                making studying
                <br />
                a little more
                <br />
                <em className="italic text-[var(--accent)]">beautiful.</em>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#4A443B] sm:text-base sm:leading-8">
                I&apos;m Harshita — a student, creator and digital resource maker sharing practical
                tools, study systems, AI resources and ideas to help students make progress.
              </p>

              <div className="mt-7 flex items-center gap-2 sm:gap-3">
                <Link
                  href="/resources?type=free"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[#FDFBF6] shadow-[0_10px_24px_rgba(47,93,80,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-deep)] hover:shadow-[0_14px_28px_rgba(47,93,80,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Explore Free Resources
                </Link>
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#1A1A1A]/20 bg-[#FFFDF8]/80 px-4 py-2.5 text-xs font-semibold text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                >
                  Visit the Shop
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </div>

              {/* Handwritten annotation + doodle arrow — arrowhead tucks up
                  toward the CTA row so the line reads "this way to free stuff" */}
              <p className="font-hand mt-3 flex items-center gap-1.5 pl-1 text-base leading-none text-[var(--accent)] sm:mt-4 sm:gap-2 sm:pl-0 sm:text-lg">
                <svg viewBox="0 0 100 60" aria-hidden="true" className="h-6 w-10 shrink-0 -translate-y-1.5 -scale-x-100 text-[var(--accent)] sm:h-8 sm:w-14 sm:-translate-y-2">
                  <path d="M6 50 C 30 44, 58 30, 88 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M78 10 l 11 1 -5 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>start here — it&apos;s all free ♡</span>
              </p>

              {/* Magazine-annotation stats */}
              <dl className="mt-9 flex gap-8 sm:gap-12">
                {statsItems.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="font-serif-display text-2xl text-[#1A1A1A] sm:text-3xl">{stat.value}</dd>
                    <dd className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A29785] sm:text-[11px]">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* ---- Scrapbook composition column (desktop only — hidden on mobile) ---- */}
          <div className="hidden lg:col-span-5 lg:block">
            <Reveal delay={120}>
              <div aria-hidden="true" className="pointer-events-none relative mx-auto h-[340px] w-[300px] select-none sm:h-[400px] sm:w-[360px] lg:h-[430px] lg:w-[390px]">
                {/* Graph-paper board */}
                <div className="paper-grid absolute inset-4 rounded-[36%] border border-[var(--line)] bg-[#FBF3DD]/60 opacity-80" />

                {/* Weekly plan checklist card */}
                <div className="absolute left-1 top-10 w-52 rotate-[-5deg] rounded-lg border border-[var(--line)] bg-[#FFFDF8] p-4 shadow-[0_12px_28px_rgba(26,26,26,0.10)] sm:w-60">
                  <span className="tape absolute -top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">weekly plan</p>
                  <div className="mt-3 space-y-2.5">
                    {['Revise chapter 4', 'Solve past paper', 'Plan tomorrow'].map((task, index) => (
                      <div key={task} className="flex items-center gap-2 text-[11px] font-medium text-[#4A443B]">
                        <span className={`grid h-4 w-4 place-items-center rounded-full ${index < 2 ? 'bg-[var(--sage)] text-white' : 'border border-[#C9BFA9] text-transparent'}`}>
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                        <span className={index < 2 ? 'line-through decoration-[var(--sage)]' : ''}>{task}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                    <div className="h-full w-2/3 rounded-full bg-[var(--sage)]" />
                  </div>
                </div>

                {/* Focus notes mini book */}
                <div className="absolute right-1 top-24 w-36 rotate-[6deg] rounded-lg bg-[var(--sage)] p-4 text-[#FDFBF6] shadow-[0_12px_28px_rgba(26,26,26,0.14)] sm:w-40">
                  <div className="flex items-center justify-between">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-80">no. 01</span>
                  </div>
                  <p className="font-serif-display mt-6 text-xl italic leading-tight">focus<br />notes</p>
                  <div className="mt-4 h-px w-10 bg-white/50" />
                </div>

                {/* Consistency check polaroid */}
                <div className="absolute bottom-4 left-6 w-52 rotate-[3deg] rounded-lg border border-[var(--line)] bg-[var(--blush-soft)] p-4 shadow-[0_12px_28px_rgba(26,26,26,0.10)] sm:w-56">
                  <span className="tape absolute -top-2.5 left-4 h-5 w-16 rotate-[6deg]" />
                  <p className="font-hand text-xl leading-none text-[#1A1A1A]">consistency check ✓</p>
                  <p className="mt-2 text-[11px] font-semibold text-[#6B6257]">7-day study streak</p>
                  <div className="mt-2.5 flex gap-1.5">
                    {[...Array(7)].map((_, i) => (
                      <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < 5 ? 'bg-[var(--sage)]' : 'border border-[#C9BFA9] bg-transparent'}`} />
                    ))}
                  </div>
                </div>

                {/* Stickers */}
                <span className="sticker-dot absolute -top-1 right-8 !rotate-[10deg] !bg-[var(--butter)]">✷</span>
                <span className="sticker-dot absolute -right-1 bottom-20 !rotate-[-6deg] !bg-[var(--sky)] text-white">♡</span>
                <span className="font-hand absolute -left-2 bottom-28 rotate-[-10deg] text-lg text-[#6B6257]">study buddy approved →</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= Ticker strip ================= */}
      <section aria-label="What you will find here" className="overflow-hidden border-y border-[#1A1A1A] bg-[#1A1A1A] py-3">
        <div className="animate-ticker flex w-max whitespace-nowrap font-serif-display text-lg italic text-[#FAF6EF] sm:text-xl">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={index} className="flex items-center">
              <span className="px-5">{item}</span>
              <span aria-hidden="true" className="not-italic text-[var(--butter)]">✷</span>
            </span>
          ))}
        </div>
      </section>

      {/* ================= Featured resources ================= */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">featured finds</p>
            <h2 className="font-serif-display mt-1 text-3xl italic text-[#1A1A1A] sm:text-4xl">your new study internet rabbit hole.</h2>
          </Reveal>

          <div className="mt-8 space-y-10">
            {loading ? (
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square w-[44%] shrink-0 animate-pulse bg-[var(--sage-soft)] sm:w-auto" />
                ))}
              </div>
            ) : !hasFeatured ? (
              <div className="rounded-2xl border border-dashed border-[#C9BFA9] bg-[#FFFDF8] py-14 text-center">
                <h3 className="font-serif-display text-2xl italic text-[#1A1A1A]">New resources launching soon</h3>
                <p className="mt-1 text-sm text-[#6B6257]">We are putting the final touches on the study material.</p>
              </div>
            ) : (
              [
                { id: 'paid', kicker: 'paid notes', title: 'notes students swear by', items: featuredPaid },
                { id: 'free', kicker: 'free notes', title: 'start with something free', items: featuredFree },
              ]
                .filter((row) => row.items.length > 0)
                .map((row) => (
                  <div key={row.id}>
                    <div className="mb-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A29785]">{row.kicker}</p>
                        <h3 className="font-serif-display mt-0.5 text-xl italic text-[#1A1A1A] sm:text-2xl">{row.title}</h3>
                      </div>
                      <Link href={`/resources?type=${row.id}`} className="shrink-0 text-[13px] font-semibold text-[var(--accent)] hover:underline sm:text-sm">
                        View all →
                      </Link>
                    </div>
                    {/* Mobile: swipeable rail — cards keep phone size and the
                        row scrolls instead of wrapping. Desktop: 4-up grid. */}
                    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-5">
                      {row.items.map((resource) => {
                        // Numeric price after discount — formatted exactly once at render.
                        // Coerce so a string discount ("20") still shows the discounted price.
                        const discountValue = Number(resource.discount);
                        const hasDiscount = Number.isFinite(discountValue) && discountValue > 0 && discountValue < 100;
                        const finalPrice = hasDiscount ? discountedPrice(resource.price, discountValue) : resource.price;
                        // Cover image: newer uploads only fill images[], older ones only thumbnailUrl.
                        const displayImage = resource.images && resource.images.length > 0 ? resource.images[0] : resource.thumbnailUrl;
                        const isBestseller = (resource.avgRating || 0) >= 4.5 || resource.price >= 2000;
                        return (
                          <button
                            key={resource._id}
                            type="button"
                            onClick={() => router.push(`/resource/${resource._id}`)}
                            className="group h-full w-[44%] shrink-0 snap-start text-left sm:w-auto"
                          >
                            <div className="relative h-full overflow-hidden rounded-lg border border-[var(--line)] bg-[#FFFDF8]">
                              <span
                                className={`absolute left-0 top-3 z-10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-md ${
                                  isBestseller ? 'bg-[var(--butter)] text-[#1A1A1A]' : 'bg-[var(--accent)] text-[#FDFBF6]'
                                }`}
                              >
                                {isBestseller ? '★ Bestseller' : 'Trending'}
                              </span>
                              <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-[var(--sage-soft)]">
                                {displayImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={displayImage} alt={resource.title} loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="grid h-full place-items-center text-[var(--accent)]"><BookOpen className="h-10 w-10" /></div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{resource.category}</p>
                                <h4 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#1A1A1A] sm:text-[15px]">{resource.title}</h4>
                                <div className="flex items-baseline gap-1.5 pt-1">
                                  {resource.price === 0 || (resource.price === undefined && row.id === 'free') ? (
                                    <span className="text-base font-extrabold text-[var(--accent)] sm:text-lg">Free</span>
                                  ) : (
                                    <>
                                      {hasDiscount && <span className="text-xs text-[#A29785] line-through">{formatPrice(resource.price)}</span>}
                                      <span className="text-base font-extrabold text-[#1A1A1A] sm:text-lg">{formatPrice(finalPrice)}</span>
                                    </>
                                  )}
                                  {(resource.totalReviews || 0) > 0 && (
                                    <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#4A443B]">
                                      <Star className="h-3 w-3 fill-[var(--butter)] text-[#D9A93F]" />
                                      {(resource.avgRating || 0).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* ================= what can you find here? ================= */}
      <section className="border-t border-[var(--line)] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">the map</p>
            <h2 className="font-serif-display mt-1 text-4xl font-bold text-[#1A1A1A] sm:text-5xl">what can you find here?</h2>
          </Reveal>

          {/* Mobile: swipeable editorial cards; desktop: asymmetric 6-col grid */}
          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-6 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
            {CATEGORY_CARDS.map((card, index) => (
              <Reveal
                key={card.id}
                delay={index * 70}
                className={`w-[78%] shrink-0 snap-start sm:w-auto ${card.span}`}
              >
                <Link
                  href={card.href}
                  className={`group flex h-full flex-col rounded-2xl border border-[var(--line)] ${card.bg} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(26,26,26,0.10)]`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-serif-display text-4xl italic text-[#1A1A1A]/20">{card.id}</span>
                    <span aria-hidden="true" className="font-hand text-lg text-[#1A1A1A]/40 transition-transform duration-300 group-hover:rotate-6">{['✷', '♡', '✦', '✿', '✸'][index]}</span>
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/60">{card.label}</p>
                  <h3 className="font-serif-display mt-1 text-2xl font-bold leading-tight text-[#1A1A1A] sm:text-3xl">{card.text}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4A443B]">{card.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-bold text-[#1A1A1A] underline decoration-[var(--accent)] decoration-2 underline-offset-4 transition-colors group-hover:text-[var(--accent)]">
                    {card.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
