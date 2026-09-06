'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import UserActivityTracker from '@/components/tracking/UserActivityTracker';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        <UserActivityTracker />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
