import type { Metadata } from 'next';
import { ArrowDown, CheckCircle2, ChevronDown, Gift, GraduationCap, Link2, Wallet } from 'lucide-react';
import EarningsPreview from '@/components/referrals/EarningsPreview';
import ReferralApplyButton from '@/components/referrals/ReferralApplyButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Student Earning Opportunity | Studious Harshita',
  description: 'A flexible earning opportunity for students who love sharing useful study finds. Apply to join the Studious Harshita community.',
  alternates: { canonical: '/referral-program' },
  openGraph: {
    type: 'website',
    url: '/referral-program',
    siteName: SITE_NAME,
    title: `A Student Earning Opportunity | ${SITE_NAME}`,
    description: 'Share study finds you love and get rewarded when your recommendations lead to eligible purchases.',
  },
};

export default function ReferralProgramPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Student earning opportunity by Studious Harshita',
    url: `${SITE_URL}/referral-program`,
    description: 'An opportunity for students to earn by sharing useful study resources.',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />
      <JsonLd data={structuredData} />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-[var(--line)] bg-[var(--card-bg)]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[var(--accent-soft)] opacity-80 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[30%] h-72 w-72 rounded-full bg-[#F3EBD8] opacity-70 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-soft-2)] bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[.13em] text-[var(--accent-deep)] shadow-sm">
                <GraduationCap className="h-4 w-4" /> A little extra earning potential
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.04] tracking-[-.045em] text-[var(--text-primary)] sm:text-5xl lg:text-[3.6rem]">
                Your next good recommendation could <span className="text-[var(--accent)]">pay you back.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                Love finding study tools your friends will actually use? Turn that into a flexible earning opportunity with Studious Harshita.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ReferralApplyButton />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Free to apply · student-friendly · share at your pace</span>
              </div>
              <p className="mt-3 text-[11px] text-[var(--text-secondary)]">Rewards depend on eligible purchases and current program terms.</p>
            </div>

            <EarningsPreview />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 pb-5 text-center sm:px-6 lg:px-8">
            <a href="#opportunity-details" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-deep)] hover:underline">See what&apos;s included <ArrowDown className="h-3.5 w-3.5" /></a>
          </div>
        </section>

        <section id="opportunity-details" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[var(--accent)]">The opportunity</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)]">Make your recommendations count.</h2>
              <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">No need to be an influencer. Share with a class group, a friend, or the community you already have. We want genuine recommendations—not spam.</p>
              <ReferralApplyButton className="mt-6" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['No joining fee', 'Start without paying to participate.'],
                ['Share at your pace', 'Choose what to share and where it fits your community.'],
                ['Rewards for impact', 'Eligible purchases can earn the commission set for that resource.'],
                ['Track your progress', 'Your profile shows clicks, referred purchases and commission.'],
              ].map(([title, description]) => <article key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-5 shadow-sm"><CheckCircle2 className="h-5 w-5 text-[var(--accent)]" /><h3 className="mt-3 font-bold text-[var(--text-primary)]">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p></article>)}
            </div>
          </div>
        </section>

        <details className="mx-auto mb-14 max-w-4xl px-4 sm:px-6 lg:px-8">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-5 text-sm font-bold text-[var(--text-primary)] shadow-sm [&::-webkit-details-marker]:hidden">
            Want to know how the program works?
            <ChevronDown className="h-4 w-4 text-[var(--accent)] transition-transform" />
          </summary>
          <div className="grid gap-3 border-x border-b border-[var(--line)] bg-[var(--card-bg)] p-5 sm:grid-cols-3">
            <article className="rounded-xl bg-[var(--background)] p-4"><Gift className="h-5 w-5 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-bold text-[var(--text-primary)]">1. Join</h3><p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Sign in and open Refer &amp; Earn in your profile.</p></article>
            <article className="rounded-xl bg-[var(--background)] p-4"><Link2 className="h-5 w-5 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-bold text-[var(--text-primary)]">2. Share</h3><p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Copy links for resources you want to recommend.</p></article>
            <article className="rounded-xl bg-[var(--background)] p-4"><Wallet className="h-5 w-5 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-bold text-[var(--text-primary)]">3. Get rewarded</h3><p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">Eligible purchases are attributed to you; commission depends on the resource and current program settings.</p></article>
          </div>
        </details>
      </main>
      <Footer />
    </div>
  );
}
