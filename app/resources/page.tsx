import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourcesBrowser from '@/components/resources/ResourcesBrowser';
import BlueDotLoader from '@/components/ui/BlueDotLoader';
import { SITE_NAME } from '@/lib/site';

const RESOURCES_TITLE = 'Browse Study Resources — Free & Premium Notes';

export const metadata: Metadata = {
  title: { absolute: `${RESOURCES_TITLE} | ${SITE_NAME}` },
  description:
    'Browse all free and premium study resources from Studious Harshita: notes, planners and exam material for school, college and competitive exam students across India.',
  keywords: [
    'study resources',
    'free study notes',
    'premium study material',
    'exam notes India',
    'study resources Ahmedabad',
  ],
  alternates: { canonical: '/resources' },
  openGraph: {
    type: 'website',
    url: '/resources',
    siteName: SITE_NAME,
    title: `${RESOURCES_TITLE} | ${SITE_NAME}`,
    description:
      'Browse all free and premium study resources: notes, planners and exam material for students across India.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${RESOURCES_TITLE} | ${SITE_NAME}`,
    description:
      'Browse all free and premium study resources from Studious Harshita.',
  },
};

export default function ResourcesPage() {
  return (
    <div className="academic-surface min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <div className="grid flex-1 place-items-center py-24" role="status" aria-label="Loading">
              <BlueDotLoader className="h-16 w-16" />
            </div>
          }
        >
          <ResourcesBrowser />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
