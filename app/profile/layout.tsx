import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile & Orders',
  description: 'Manage your account details and review your study resource orders.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/profile' },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
