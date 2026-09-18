import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Internal analytics for Studious Harshita.',
  robots: { index: false, follow: false, nocache: true },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
