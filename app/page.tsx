import type { Metadata } from 'next';
import { Suspense } from 'react';
import HomeLanding from '@/components/home/HomeLanding';
import {
  WelcomeSection,
  AboutSection,
  ShopSection,
  CommunityQuotesSection,
  FaqSection,
  NewsletterSection,
  FinalCtaSection,
} from '@/components/home/HomeSections';
import GuidesTeaser from '@/components/home/GuidesTeaser';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BlueDotLoader from '@/components/ui/BlueDotLoader';
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, SITE_NAME } from '@/lib/site';

const HOME_TITLE = 'Free & Premium Study Resources, Notes & AI Tools for Students';
const HOME_DESCRIPTION =
  'Making studying a little more beautiful — free study resources, premium notes, student productivity systems, scholarship resources and AI tools for students.';

export const metadata: Metadata = {
  title: { absolute: `${HOME_TITLE} | ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
  },
};

export default function Home() {
  return (
    <div className="academic-surface min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* 1. Hero + featured resources (paid first, then free) */}
        <Suspense
          fallback={
            <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
              <BlueDotLoader className="h-20 w-20" />
            </div>
          }
        >
          <HomeLanding />
        </Suspense>

        {/* 2. Blog — "from my desk" */}
        <GuidesTeaser />

        {/* 3. Welcome to my little corner (yellow-box intro) */}
        <WelcomeSection />

        {/* 4. About — the girl behind the notes */}
        <AboutSection />

        {/* 5. Shop — paid resources */}
        <ShopSection />

        {/* 6. Community quotes */}
        <CommunityQuotesSection />

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. Newsletter */}
        <NewsletterSection />

        {/* 9. Closing CTA */}
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
