import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

const SUPPORT_TITLE = 'Help & Support — Order, Access & Refund Help';
const SUPPORT_DESCRIPTION =
  'Raise and track support tickets for payments, resource access, downloads and refunds with Studious Harshita. We reply within 24–48 business hours.';

export const metadata: Metadata = {
  title: SUPPORT_TITLE,
  description: SUPPORT_DESCRIPTION,
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: '/support',
    title: `${SUPPORT_TITLE} | ${SITE_NAME}`,
    description: SUPPORT_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SUPPORT_TITLE} | ${SITE_NAME}`,
    description: SUPPORT_DESCRIPTION,
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
