import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { BUSINESS_ADDRESS_TEXT, CONTACT_EMAIL, SITE_NAME, SITE_WORDMARK } from '@/lib/site';

// Update the Pinterest URL once the official profile is live.
const PINTEREST_URL = 'https://www.pinterest.com/';

const FOOTER_NAV = [
  { href: '/about', label: 'About' },
  { href: '/resources', label: 'Resources' },
  { href: '/resources?type=paid', label: 'Shop' },
  { href: '/guides', label: 'Blog' },
  { href: '/support', label: 'Work With Me' },
  { href: '/contact', label: 'Contact' },
];

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/studious_harshita', label: 'Instagram' },
  { href: 'https://youtube.com/@studious_harshita', label: 'YouTube' },
  { href: PINTEREST_URL, label: 'Pinterest' },
  { href: 'https://www.linkedin.com/in/siddharth-deshmukh2028', label: 'LinkedIn' },
];

const LEGAL_LINKS = [
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refund Policy' },
  { href: '/shipping-policy', label: 'Shipping & Delivery' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A] bg-[#1A1A1A] text-[#FAF6EF]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
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
          <nav aria-label="Footer navigation">
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

          {/* Social */}
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

          {/* Contact */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FAF6EF]/50">Say hello</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#FAF6EF]/80">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--butter)]" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="break-all transition-colors hover:text-[var(--butter)]">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--butter)]" />
                <span>{BUSINESS_ADDRESS_TEXT}</span>
              </li>
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
