import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Resources',
  description: 'Study resources you have saved for later.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/wishlist' },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
