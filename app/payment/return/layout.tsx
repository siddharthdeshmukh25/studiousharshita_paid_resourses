import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Status',
  description: 'Status of your recent payment for digital study resources.',
  robots: { index: false, follow: false, nocache: true },
};

export default function PaymentReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
