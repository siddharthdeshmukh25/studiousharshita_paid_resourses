'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function UserActivityTracker() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || pathname.startsWith('/admin')) return;
    
    // Check if this session has already been tracked for website visit
    const sessionKey = 'website_visit_tracked';
    const hasTracked = sessionStorage.getItem(sessionKey);
    
    if (!hasTracked) {
      // Track the first visit in this session
      void fetch('/api/tracking/user-activity', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ path: pathname, isSessionStart: true }) 
      });
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [pathname, status]);

  return null;
}
