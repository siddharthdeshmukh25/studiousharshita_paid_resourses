import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import Providers from '@/components/providers';
import ToastProvider from '@/components/ui/Toast';
import JsonLd from '@/components/seo/JsonLd';
import CustomCursor from '@/components/ui/CustomCursor';
import {
  BUSINESS_ADDRESS,
  SUPPORT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  LEGAL_ENTITY,
  SITE_NAME,
  SITE_URL,
  SITE_WORDMARK,
  SOCIAL_PROFILES,
  siteUrl,
} from '@/lib/site';
import NextTopLoader from 'nextjs-toploader';

const geistSans = localFont({
  src: './fonts/geist-latin.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/geist-mono-latin.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
});

const instrumentSerif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin.woff2', style: 'normal', weight: '400' },
    { path: './fonts/instrument-serif-italic-latin.woff2', style: 'italic', weight: '400' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const poppins = localFont({
  src: './fonts/poppins-regular-latin.woff2',
  variable: '--font-poppins',
  weight: '400',
  display: 'swap',
});

const poppinsMedium = localFont({
  src: './fonts/poppins-medium-latin.woff2',
  variable: '--font-poppins-medium',
  weight: '500',
  display: 'swap',
});

const inter = localFont({
  src: './fonts/inter-bold-latin.woff2',
  variable: '--font-inter',
  weight: '700',
  display: 'swap',
});

const caveat = localFont({
  src: './fonts/caveat-latin.woff2',
  variable: '--font-caveat',
  weight: '400 600',
  display: 'swap',
});

/**
 * Home-page metadata doubles as the site default. Every other route in the app
 * (plus every client-rendered page's layout.tsx) sets its own title, description
 * and canonical so no two pages share the same metadata.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Premium Study Notes & Resources for Students in Ahmedabad | Studious Harshita",
    template: "%s | Studious Harshita",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: LEGAL_ENTITY }],
  creator: LEGAL_ENTITY,
  publisher: SITE_NAME,
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: 'Premium Study Notes & Resources for Students in Ahmedabad | Studious Harshita',
    description: DEFAULT_DESCRIPTION,
    locale: 'en_IN',
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Study Notes & Resources | Studious Harshita',
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

/** Organization + WebSite schema: tells search and AI engines who we are. */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  alternateName: SITE_WORDMARK,
  legalName: LEGAL_ENTITY,
  url: SITE_URL,
  logo: siteUrl('/favicon.svg'),
  image: siteUrl(DEFAULT_OG_IMAGE),
  description: DEFAULT_DESCRIPTION,
  email: SUPPORT_EMAIL,
  founder: { '@type': 'Person', name: LEGAL_ENTITY },
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS_ADDRESS.street,
    addressLocality: BUSINESS_ADDRESS.city,
    addressRegion: BUSINESS_ADDRESS.region,
    postalCode: BUSINESS_ADDRESS.postalCode,
    addressCountry: BUSINESS_ADDRESS.country,
  },
  areaServed: [{ '@type': 'Country', name: 'India' }, { '@type': 'City', name: 'Ahmedabad' }],
  knowsAbout: ['study notes', 'exam preparation', 'study planning', 'digital study resources'],
  sameAs: SOCIAL_PROFILES,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: SUPPORT_EMAIL,
    areaServed: 'IN',
    availableLanguage: ['en', 'hi', 'gu'],
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: SITE_WORDMARK,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'en-IN',
  publisher: { '@type': 'EducationalOrganization', name: SITE_NAME, url: SITE_URL },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${poppins.variable} ${inter.variable} ${caveat.variable} ${poppinsMedium.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#FAF6EF]">
        <NextTopLoader
          color="#2F5D50"
          initialPosition={0.3}
          crawl={true}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          speed={200}
          shadow="0 0 10px rgba(47,93,80,0.4)"
        />
        <CustomCursor />
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
