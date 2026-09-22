import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, Mail, Megaphone, Sparkles, Target } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CollaborationEnquiryForm from '@/components/contact/CollaborationEnquiryForm';
import Reveal from '@/components/ui/Reveal';
import JsonLd from '@/components/seo/JsonLd';
import { BRAND_EMAIL, SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Collaborate with Studious Harshita — Brand Deals & Creator Partnerships',
  description:
    'Partner with Studious Harshita to reach 30K+ students across India. Sponsored content, brand integrations, product reviews and affiliate collaborations for study, stationery and student-life brands.',
  keywords: [
    'Studious Harshita collaboration',
    'brand deals study influencer India',
    'student creator partnership',
    'sponsored content study notes',
    'education brand collaboration Ahmedabad',
  ],
  alternates: { canonical: '/collaboration' },
  openGraph: {
    type: 'website',
    url: '/collaboration',
    title: `Collaborate with ${SITE_NAME}`,
    description:
      'Brand deals & creator partnerships — reach 30K+ ambitious students across India through Studious Harshita.',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Collaborate with ${SITE_NAME}`,
    description: 'Brand deals & creator partnerships for study, stationery and student-life brands.',
  },
};

const collaborationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `Collaborate with ${SITE_NAME}`,
  url: siteUrl('/collaboration'),
  description: 'Brand deals and creator partnerships with Studious Harshita.',
  isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
};

const AUDIENCE_STATS = [
  { value: '30K+', label: 'community members' },
  { value: '2M+', label: 'monthly reach' },
  { value: '5–12', label: 'school classes served' },
  { value: 'UG + PG', label: 'college & exam aspirants' },
];

const COLLAB_FORMATS = [
  {
    icon: Megaphone,
    title: 'Sponsored content',
    description:
      'Dedicated posts, story sequences or video integrations about your product — scripted in my honest, student-first voice.',
    accent: 'bg-[var(--blush-soft)]',
  },
  {
    icon: Sparkles,
    title: 'Product reviews & giveaways',
    description:
      'Stationery, planners, apps or courses — tried and reviewed for my audience, with giveaway drops that actually convert.',
    accent: 'bg-[var(--sky-soft)]',
  },
  {
    icon: HeartHandshake,
    title: 'Affiliate partnerships',
    description:
      'Long-term affiliate collabs with custom codes and links tracked across my study resources and social channels.',
    accent: 'bg-[var(--butter-soft)]',
  },
  {
    icon: Target,
    title: 'Resource co-creation',
    description:
      'Co-branded planners, templates or note packs built with your brand baked in — useful content students keep returning to.',
    accent: 'bg-[var(--sage-soft)]',
  },
];

const PROCESS = [
  { step: '01', title: 'You reach out', description: 'Email me your brand, campaign idea and timeline — I reply within 48 hours.' },
  { step: '02', title: 'We align', description: 'A short call to match your goals with my audience and pick the right format.' },
  { step: '03', title: 'I create', description: 'Content is drafted for your approval — no surprises, no forced scripts.' },
  { step: '04', title: 'We measure', description: 'Post-campaign report with reach, engagement and honest learnings.' },
];

export default function CollaborationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <JsonLd data={collaborationSchema} />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--line)] py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">brand deals · partnerships</p>
              <h1 className="font-serif-display mt-2 text-4xl leading-tight text-[#1A1A1A] sm:text-5xl">
                Let&apos;s build something <em className="italic text-[var(--accent)]">students</em> actually love.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#4A443B] sm:text-base sm:leading-8">
                Studious Harshita reaches thousands of school, college and competitive-exam students
                across India every month. If your brand makes life better for students — stationery,
                apps, courses, wellness, finance — I&apos;d love to hear about it.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`mailto:${BRAND_EMAIL}?subject=Collaboration%20proposal`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#FDFBF6] transition-all hover:-translate-y-1 hover:bg-[var(--accent-deep)] hover:shadow-lg"
                >
                  <Mail className="h-4 w-4" /> {BRAND_EMAIL}
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1A1A1A]/20 bg-[#FFFDF8] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  About me first
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Audience stats */}
        <section className="border-b border-[var(--line)] bg-[var(--accent-soft)]/40 py-10 sm:py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {AUDIENCE_STATS.map((stat, index) => (
                <Reveal key={stat.label} delay={index * 70}>
                  <div className="rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-5 text-center shadow-[0_6px_18px_rgba(26,26,26,0.05)]">
                    <dd className="font-serif-display text-2xl italic text-[#1A1A1A] sm:text-3xl">{stat.value}</dd>
                    <dt className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6257]">{stat.label}</dt>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* Collaboration formats */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">ways to work together</p>
              <h2 className="font-serif-display mt-1 text-3xl italic text-[#1A1A1A] sm:text-4xl">pick what fits your brand.</h2>
            </Reveal>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:gap-6">
              {COLLAB_FORMATS.map((format, index) => (
                <Reveal key={format.title} delay={(index % 2) * 90}>
                  <div className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-5 shadow-[0_8px_20px_rgba(26,26,26,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(26,26,26,0.09)] sm:p-6">
                    <span aria-hidden="true" className={`mb-4 grid h-11 w-11 place-items-center rounded-lg ${format.accent}`}>
                      <format.icon className="h-5 w-5 text-[#1A1A1A]" />
                    </span>
                    <h3 className="font-serif-display text-xl italic text-[#1A1A1A]">{format.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#4A443B]">{format.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="border-t border-[var(--line)] bg-[var(--butter-soft)]/50 py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal>
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6257]">how it goes</p>
              <h2 className="font-serif-display mt-1 text-center text-3xl italic text-[#1A1A1A] sm:text-4xl">
                four steps, zero awkwardness.
              </h2>
            </Reveal>
            <ol className="mt-9 space-y-4">
              {PROCESS.map((step, index) => (
                <Reveal key={step.step} delay={index * 70}>
                  <li className="flex items-start gap-4 rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-5">
                    <span aria-hidden="true" className="font-serif-display shrink-0 text-2xl italic text-[var(--accent)]">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A1A] sm:text-base">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#6B6257]">{step.description}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Enquiry form */}
        <section id="enquiry" className="scroll-mt-24 border-t border-[var(--line)] bg-[#FAF6EF] py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal className="mb-8 text-center">
              <h2 className="font-serif-display text-3xl italic leading-tight text-[#1A1A1A] sm:text-4xl">
                tell me about your brand
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#6B6257] sm:text-base">
                Every enquiry lands in the same inbox as a personal email — reviewed personally and answered within two business days.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <CollaborationEnquiryForm />
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[#1A1A1A] bg-[#1A1A1A] py-14 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Reveal>
              <span aria-hidden="true" className="font-serif-display text-3xl italic text-[var(--butter)]">✷</span>
              <h2 className="font-serif-display mt-3 text-3xl italic leading-tight text-[#FAF6EF] sm:text-4xl">
                have a student-loved product? let&apos;s talk.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#FAF6EF]/70 sm:text-base">
                Drop a line with your brand and idea — media kit and rate card available on request.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`mailto:${BRAND_EMAIL}?subject=Collaboration%20proposal`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#FDFBF6] transition-all hover:-translate-y-1 hover:bg-[var(--accent-deep)] hover:shadow-lg"
                >
                  <Mail className="h-4 w-4" /> {BRAND_EMAIL}
                </a>
                <a
                  href="#enquiry"
                  className="inline-flex items-center gap-2 rounded-full border border-[#FAF6EF]/30 px-6 py-3 text-sm font-bold text-[#FAF6EF] transition-colors hover:border-[var(--butter)] hover:text-[var(--butter)]"
                >
                  Fill the enquiry form <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
