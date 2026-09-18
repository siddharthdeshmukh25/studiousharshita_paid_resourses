import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Study Resources',
  description: 'Your purchased and free study resources in one place.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/dashboard' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
