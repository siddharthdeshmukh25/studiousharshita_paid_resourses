import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Poppins, Inter, Caveat } from "next/font/google";
import "./globals.css";
import Providers from '@/components/providers';
import JsonLd from '@/components/seo/JsonLd';
import CustomCursor from '@/components/ui/CustomCursor';
import {
  BUSINESS_ADDRESS,
  CONTACT_EMAIL,
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
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
  email: CONTACT_EMAIL,
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
    email: CONTACT_EMAIL,
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${poppins.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
