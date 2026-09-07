'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import UserActivityTracker from '@/components/tracking/UserActivityTracker';
import SiteThemeApplier from '@/components/SiteThemeApplier';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <WishlistProvider>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async />
          <script src="https://checkout.razorpay.com/v1/checkout.js" async />
          <UserActivityTracker />
          <SiteThemeApplier />
          {children}
        </WishlistProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
