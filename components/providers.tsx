'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async />
      {children}
    </SessionProvider>
  );
}
