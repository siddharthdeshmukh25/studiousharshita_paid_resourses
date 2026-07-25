'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <script
        src="https://checkout.razorpay.com/v1/checkout.js"
        async
      />
      {children}
    </SessionProvider>
  );
}
