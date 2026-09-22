'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { SITE_NAME } from '@/lib/site';
import { useBrandProfile } from '@/lib/brand-profile';

const SOCIAL_LABELS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'threads', label: 'Threads' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'snapchat', label: 'Snapchat' },
] as const;

const FOOTER_NAV = [
  { href: '/about', label: 'About' },
  { href: '/resources', label: 'Resources' },
  { href: '/resources?type=paid', label: 'Shop' },
  { href: '/guides', label: 'Blog' },
  { href: '/support', label: 'Work With Me' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refund Policy' },
  { href: '/shipping-policy', label: 'Shipping & Delivery' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

export default function Footer() {
  const profile = useBrandProfile();

  // Admin-editable links/emails (lib/site.ts defaults) — empty entries are hidden.
  const SOCIAL_LINKS = SOCIAL_LABELS.map(({ key, label }) => ({ href: profile.socials[key], label })).filter(
    (link) => link.href
  );
  const CONTACT_EMAILS = [
    { email: profile.emails.support, purpose: 'Support' },
    { email: profile.emails.contact, purpose: 'General queries' },
    { email: profile.emails.brand, purpose: 'Brand deals' },
  ].filter((entry) => entry.email);

  return (
    <footer className="border-t border-[#1A1A1A] bg-[#1A1A1A] text-[#FAF6EF]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <p className="font-serif-display text-2xl tracking-tight">
              studious<span className="italic text-[var(--butter)]">harshita</span><span className="text-[var(--butter)]">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#FAF6EF]/60">
              {SITE_NAME} — a personal digital hub for students: study resources, productivity systems,
              AI tools and digital products for ambitious students across India.
            </p>
            <p className="font-hand mt-4 text-lg text-[var(--butter)]">made for students ♡</p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation" className="min-w-0">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FAF6EF]/50">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#FAF6EF]/80 transition-colors hover:text-[var(--butter)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social — editable from /admin/profile */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FAF6EF]/50">Elsewhere</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FAF6EF]/80 transition-colors hover:text-[var(--butter)]"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — editable from /admin/profile */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FAF6EF]/50">Say hello</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#FAF6EF]/80">
              {CONTACT_EMAILS.map(({ email, purpose }) => (
                <li key={email} className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--butter)]" />
                  <span>
                    <a href={`mailto:${email}`} className="break-all transition-colors hover:text-[var(--butter)]">
                      {email}
                    </a>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-[#FAF6EF]/45">
                      {purpose}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-[#FAF6EF]/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-hand text-lg text-[#FAF6EF]/70">Made with curiosity, coffee &amp; too many tabs open.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#FAF6EF]/50">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--butter)]">
                {link.label}
              </Link>
            ))}
            <span>&copy; {new Date().getFullYear()} {SITE_NAME}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[#FAF6EF]/35 sm:text-right">
          Built by <a href="https://www.linkedin.com/in/siddharth-deshmukh2028/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--butter)]">Siddharth Deshmukh</a>
        </p>
      </div>
    </footer>
  );
}
