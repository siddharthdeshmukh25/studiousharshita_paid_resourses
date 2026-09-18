import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Console',
  description: 'Internal administration console for Studious Harshita.',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
