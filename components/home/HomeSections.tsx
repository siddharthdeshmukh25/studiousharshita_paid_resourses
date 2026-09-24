'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Loader2, Mail, Sparkles, Star } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import Reveal from '@/components/ui/Reveal';
import { useBrandProfile } from '@/lib/brand-profile';

/**
 * Editorial body sections for the home page, each exported individually so
 * app/page.tsx can compose the homepage rhythm: hero → featured resources →
 * blog → welcome intro → magazine profile → shop → community quotes → FAQ →
 * newsletter → closing CTA. All copy follows the editorial Studygram voice.
 */

interface ShopResource {
  _id: string;
  title: string;
  price: number;
  discount?: number;
  category: string;
  thumbnailUrl?: string;
  images?: string[];
}

interface StatReview {
  userName: string;
  rating: number;
  comment: string;
  resourceTitle: string;
}

const FAQS = [
  {
    q: 'How do I get the notes after paying?',
    a: 'Instantly. The moment your payment succeeds, your resource is unlocked in your dashboard and delivered via Google Drive — no waiting, no shipping.',
  },
  {
    q: 'Are the notes useful for my board or exam?',
    a: 'Every resource is mapped chapter-by-chapter to the actual syllabus — CBSE, state boards, college courses and competitive exams. Each product page tells you exactly which syllabus it covers.',
  },
  {
    q: 'What if a resource does not help me?',
    a: 'Start with a free resource to judge the quality yourself. If something goes wrong with a purchase, the refund policy has you covered — raise a support ticket and you get a reply within 24–48 hours.',
  },
  {
    q: 'Do I pay again to reuse my notes next year?',
    a: 'No. Every purchase includes lifetime access on any device. Buy once, revise forever.',
  },
];

const FALLBACK_TESTIMONIALS: StatReview[] = [
  {
    userName: 'Aarav S.',
    rating: 5,
    comment: 'The revision sheets saved me during boards. Everything was exactly what my teacher expected in answers.',
    resourceTitle: '',
  },
  {
    userName: 'Diya P.',
    rating: 5,
    comment: 'Clean, well-organized notes. I stopped making my own summaries halfway through the year and just used these.',
    resourceTitle: '',
  },
  {
    userName: 'Kabir M.',
    rating: 5,
    comment: 'The weekly planner changed how I study. I actually know what to do every evening now.',
    resourceTitle: '',
  },
];

const AVATAR_COLORS = ['bg-[var(--sage)]', 'bg-[var(--blush)]', 'bg-[var(--sky)]', 'bg-[var(--butter)]', 'bg-[var(--clay)]'];
const SHOP_BLOCK_STYLES = [
  { bg: 'bg-[var(--butter-soft)]', label: 'planner' },
  { bg: 'bg-[var(--sage-soft)]', label: 'dashboard' },
  { bg: 'bg-[var(--blush-soft)]', label: 'tracker' },
  { bg: 'bg-[var(--sky-soft)]', label: 'planner' },
  { bg: 'bg-[var(--clay-soft)]', label: 'dashboard' },
  { bg: 'bg-[var(--sage-soft)]', label: 'planner' },
];

/** Shared /api/stats fetch — one request per page load, cached across sections. */
let statsPromise: Promise<{ reviews?: StatReview[]; totalStudents?: number }> | null = null;
function getStats() {
  if (!statsPromise) {
    statsPromise = fetch('/api/stats')
      .then((res) => res.json() as Promise<{ reviews?: StatReview[]; totalStudents?: number }>)
      .catch((error) => {
        console.error('Error fetching reviews:', error);
        return {} as { reviews?: StatReview[]; totalStudents?: number };
      });
  }
  return statsPromise;
}

function useStats() {
  const [reviews, setReviews] = useState<StatReview[]>([]);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStats().then((data) => {
      if (cancelled) return;
      setReviews(data.reviews || []);
      if (typeof data.totalStudents === 'number') setTotalStudents(data.totalStudents);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews, totalStudents };
}

/** ================= Welcome intro ================= */
export function WelcomeSection() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--line)] py-14 sm:py-20">
      <div aria-hidden="true" className="paper-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal>
          <p className="font-hand text-xl text-[var(--accent)]">made for students ♡</p>
          <h2 className="font-serif-display mt-2 text-3xl leading-tight text-[#1A1A1A] sm:text-4xl">
            Welcome to my little <em className="italic text-[var(--accent)]">corner</em> of the internet.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#4A443B] sm:text-base sm:leading-8">
            Studious Harshita is a space where students can find useful resources, productivity systems,
            AI tools, templates, study inspiration and practical guidance — everything made to help you
            study smarter, discover opportunities and build something of your own.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['study resources', 'AI tools for students', 'Notion templates', 'scholarship resources'].map((chip) => (
              <span key={chip} className="rounded-full border border-[#1A1A1A]/15 bg-[#FFFDF8] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B6257]">
                {chip}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Scrapbook composition */}
        <Reveal delay={120}>
          <div aria-hidden="true" className="pointer-events-none relative mx-auto h-72 w-full max-w-md select-none sm:h-80">
            <div className="paper-grid absolute inset-x-6 top-4 bottom-10 rounded-xl border border-[var(--line)] bg-[#FFFDF8]" />
            <span className="tape absolute left-1/2 top-1 -translate-x-1/2" />
            <div className="absolute left-8 top-12 w-40 rotate-[-4deg] rounded-lg bg-[var(--blush-soft)] p-4 shadow-[0_12px_28px_rgba(26,26,26,0.10)] sm:w-44">
              <p className="font-serif-display text-2xl italic text-[#1A1A1A]">study finds</p>
              <p className="font-hand mt-1 text-lg text-[#6B6257]">fresh every week ✷</p>
            </div>
            <div className="absolute right-6 top-24 w-40 rotate-[5deg] rounded-lg bg-[var(--sky-soft)] p-4 shadow-[0_12px_28px_rgba(26,26,26,0.10)] sm:w-44">
              <p className="font-hand text-xl leading-tight text-[#1A1A1A]">your next favorite resource is here →</p>
            </div>
            <div className="absolute bottom-10 left-1/2 w-48 -translate-x-1/2 rotate-[-4deg] rounded-lg bg-[var(--butter)] p-4 shadow-[0_12px_28px_rgba(26,26,26,0.12)]">
              <p className="font-serif-display text-xl italic text-[#1A1A1A]">no boring notes allowed.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** ================= About / magazine profile (photo + editable copy) ================= */
export function AboutSection() {
  const { totalStudents } = useStats();
  const profile = useBrandProfile();

  const stats = [
    ...profile.stats,
  ].map((stat) => {
    // The "students here" card is value-less in defaults — inject live count.
    if (stat.value || stat.label !== 'students here') return stat;
    return { ...stat, value: `${Math.max(totalStudents ?? 0, 100)}+` };
  });

  const STAT_BACKGROUNDS = ['bg-[#FFFDF8]', 'bg-[var(--blush-soft)]', 'bg-[var(--sky-soft)]', 'bg-[var(--butter-soft)]'];

  return (
    <section className="border-t border-[var(--line)] bg-[var(--accent-soft)]/50 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <Reveal className="lg:col-span-5">
          {/* Editorial portrait area built from layered paper blocks */}
          <div aria-hidden="true" className="pointer-events-none relative mx-auto h-80 w-72 select-none sm:h-96 sm:w-80">
            <div className="paper-grid absolute inset-0 rounded-lg border border-[var(--line)] bg-[#FFFDF8] shadow-[0_18px_40px_rgba(26,26,26,0.08)]" />
            <span className="tape absolute -top-3 left-1/2 -translate-x-1/2" />
            {profile.photoUrl ? (
              <div className="absolute inset-5 overflow-hidden rounded-md bg-[var(--sage-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.photoUrl} alt={profile.headline || 'Harshita'} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="absolute inset-5 grid place-items-center rounded-md bg-[var(--sage-soft)]">
                <div className="text-center">
                  <span className="sticker-dot mx-auto !h-14 !w-14 !text-2xl" style={{ transform: 'none' }}>✷</span>
                  <p className="font-serif-display mt-4 text-3xl italic text-[#1A1A1A]">Harshita</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">{profile.tagline}</p>
                </div>
              </div>
            )}
            <span className="font-hand absolute -bottom-5 left-2 whitespace-nowrap text-base text-[#6B6257] sm:text-xl">{profile.portraitCaption}</span>
          </div>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">{profile.eyebrow}</p>
          <h2 className="font-serif-display mt-1 text-3xl italic text-[#1A1A1A] sm:text-4xl">{profile.headline}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#4A443B] sm:text-base sm:leading-8">{profile.bio}</p>
          {/* Magazine-annotation stats — deliberately not corporate */}
          {stats.length > 0 && (
            <dl className="mt-7 grid grid-cols-2 gap-3 sm:max-w-lg">
              {stats.map((stat, index) => (
                <div key={`${stat.label}-${index}`} className={`rounded-lg border border-[var(--line)] p-4 ${STAT_BACKGROUNDS[index % STAT_BACKGROUNDS.length]}`}>
                  <dd className="font-serif-display text-2xl italic text-[#1A1A1A]">{stat.value}</dd>
                  <dt className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6257]">{stat.label}</dt>
                </div>
              ))}
            </dl>
          )}
          <Link href="/about" className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A] underline decoration-[var(--accent)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--accent)]">
            More about me →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** ================= Shop — things I made ================= */
export function ShopSection() {
  const [shopItems, setShopItems] = useState<ShopResource[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/resources?access=paid')
      .then((res) => res.json())
      .then((data: { resources?: ShopResource[] }) => {
        if (!cancelled) setShopItems((data.resources || []).slice(0, 6));
      })
      .catch((error) => console.error('Error fetching shop items:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-t border-[var(--line)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">the shop</p>
              <h2 className="font-serif-display mt-1 text-3xl italic text-[#1A1A1A] sm:text-4xl">things I made to make life easier.</h2>
            </div>
            <Link href="/resources?type=paid" className="shrink-0 text-sm font-bold text-[var(--accent)] hover:underline">
              Shop all products →
            </Link>
          </div>
        </Reveal>

        {shopItems.length > 0 ? (
          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6 lg:gap-5">
            {shopItems.map((item, index) => (
              <Reveal key={item._id} delay={index * 60} className="w-[44%] shrink-0 snap-start sm:w-auto">
                <Link href={`/resource/${item._id}`} className="group block h-full">
                  {/* Stationery-mockup style card */}
                  <div className={`relative h-full rounded-lg border border-[var(--line)] ${SHOP_BLOCK_STYLES[index % SHOP_BLOCK_STYLES.length].bg} p-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_28px_rgba(26,26,26,0.12)]`}>
                    <span className="tape absolute -top-2 left-1/2 h-5 w-14 -translate-x-1/2" />
                    <div className="flex h-24 items-center justify-center rounded-md bg-[#FFFDF8]/85 shadow-inner">
                      {/* Cover: newer uploads only fill images[], older ones only thumbnailUrl. */}
                      {(item.images && item.images.length > 0 ? item.images[0] : item.thumbnailUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(item.images && item.images.length > 0 ? item.images[0] : item.thumbnailUrl) as string} alt={item.title} loading="lazy" className="h-full w-full rounded-md object-cover" />
                      ) : (
                        <Sparkles className="h-7 w-7 text-[var(--accent)]" />
                      )}
                    </div>
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B6257]">{SHOP_BLOCK_STYLES[index % SHOP_BLOCK_STYLES.length].label}</p>
                    <h3 className="font-serif-display mt-0.5 line-clamp-2 text-lg italic leading-tight text-[#1A1A1A]">{item.title}</h3>
                    <p className="mt-1.5 text-sm font-bold text-[#1A1A1A]">
                      {item.price === 0 ? 'Free' : formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[#C9BFA9] bg-[#FFFDF8] py-12 text-center">
            <h3 className="font-serif-display text-2xl italic text-[#1A1A1A]">New planners &amp; dashboards launching soon</h3>
            <p className="mt-1 text-sm text-[#6B6257]">The shop is being restocked — check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** ================= Community quotes ================= */
export function CommunityQuotesSection() {
  const { reviews } = useStats();
  const testimonials = reviews.length > 0 ? reviews.slice(0, 6) : FALLBACK_TESTIMONIALS;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--butter-soft)]/60 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">community love</p>
          <h2 className="font-serif-display mx-auto mt-1 max-w-2xl text-center text-3xl italic leading-tight text-[#1A1A1A] sm:text-4xl">
            made for students, by someone figuring it out too.
          </h2>
        </Reveal>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review, index) => (
            <Reveal key={`${review.userName}-${index}`} delay={index * 70}>
              <figure className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-5 shadow-[0_6px_18px_rgba(26,26,26,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(26,26,26,0.09)]">
                <div className="flex items-center gap-0.5" aria-label={`Rated ${review.rating} out of 5`}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-[#D9A93F] text-[#D9A93F]' : 'text-[#D8CFC0]'}`} />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-6 text-[#3F3A32]">&ldquo;{review.comment}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-[#1A1A1A] ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                    {review.userName.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-[#1A1A1A]">{review.userName}</span>
                    {review.resourceTitle && <span className="block text-[11px] text-[#A29785]">on {review.resourceTitle}</span>}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ================= FAQ ================= */
export function FaqSection() {
  return (
    <section className="border-t border-[var(--line)] py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">good to know</p>
          <h2 className="font-serif-display mt-1 text-center text-3xl italic text-[#1A1A1A] sm:text-4xl">everything students ask.</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq, index) => (
            <Reveal key={faq.q} delay={index * 60}>
              <details className="group rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-4 open:shadow-md sm:p-5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#1A1A1A] [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sage-soft)] text-[var(--accent)] transition-transform group-open:rotate-45">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path fillRule="evenodd" d="M10 4a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 10 4Z" clipRule="evenodd" /></svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#6B6257]">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ================= Newsletter ================= */
export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribeState, setSubscribeState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || subscribeState === 'loading') return;
    setSubscribeState('loading');
    setSubscribeMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'lead_magnet_planner' }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Could not subscribe right now.');
      setSubscribeState('done');
      setSubscribeMessage(data.message || 'You are in! Watch your inbox for the next drop. ♡');
      setEmail('');
    } catch (error) {
      setSubscribeState('error');
      setSubscribeMessage(error instanceof Error ? error.message : 'Could not subscribe right now.');
    }
  };

  return (
    <section className="border-t border-[var(--line)] bg-[var(--sage-soft)] py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <span aria-hidden="true" className="sticker-dot mx-auto !rotate-[6deg] !bg-[var(--butter)]">✷</span>
          <h2 className="font-serif-display mt-4 text-3xl italic leading-tight text-[#1A1A1A] sm:text-4xl">
            come hang out in my corner of the internet.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#4A443B] sm:text-base">
            Join and a free printable study planner lands in your inbox right away — plus useful resources, study
            finds and occasional motivation after that.
          </p>
          <form onSubmit={handleSubscribe} className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
            <div className="relative flex-1">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A29785]" />
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                className="w-full rounded-full border border-[#1A1A1A]/15 bg-[#FFFDF8] py-3 pl-11 pr-4 text-sm text-[#1A1A1A] placeholder:text-[#A29785] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
            </div>
            <button
              type="submit"
              disabled={subscribeState === 'loading'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#FAF6EF] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-deep)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subscribeState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {subscribeState === 'loading' ? 'Joining…' : 'Join the community'}
            </button>
          </form>
          {subscribeMessage && (
            <p role="status" className={`mx-auto mt-3 max-w-md text-sm font-semibold ${subscribeState === 'done' ? 'text-[var(--accent-deep)]' : 'text-[#B4544A]'}`}>
              {subscribeMessage}
            </p>
          )}
          <p className="font-hand mt-4 text-lg text-[#6B6257]">no spam, ever — just good study stuff ♡</p>
        </Reveal>
      </div>
    </section>
  );
}

/** ================= Final CTA ================= */
export function FinalCtaSection() {
  return (
    <section className="border-t border-[#1A1A1A] bg-[#1A1A1A] py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="font-serif-display text-3xl italic leading-tight text-[#FAF6EF] sm:text-4xl">
            start where you are. study what you love.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#FAF6EF]/70 sm:text-base">
            Begin with a free resource, see the difference for yourself, and upgrade whenever you are ready.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#FDFBF6] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-deep)] hover:shadow-lg"
            >
              Explore Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 rounded-full border border-[#FAF6EF]/30 px-6 py-3 text-sm font-bold text-[#FAF6EF] transition-colors hover:border-[var(--butter)] hover:text-[var(--butter)]"
            >
              Read the blog
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
