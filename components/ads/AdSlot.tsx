'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_PUBLISHER_ID, ADSENSE_SLOTS } from '@/lib/adsense';

export type AdSlotName = keyof typeof ADSENSE_SLOTS;

const loadedScripts = new Set<string>();
const requestedAds = new WeakSet<HTMLModElement>();

function loadAdSense(publisherId: string) {
  if (loadedScripts.has(publisherId)) return;

  const scriptUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = scriptUrl;
    document.head.appendChild(script);
  }
  loadedScripts.add(publisherId);
}

export default function AdSlot({
  name,
  className = '',
  minViewportWidth,
  maxViewportWidth,
  format = 'auto',
}: {
  name: AdSlotName;
  className?: string;
  minViewportWidth?: number;
  maxViewportWidth?: number;
  format?: 'auto' | 'vertical';
}) {
  const slotId = ADSENSE_SLOTS[name];
  const adRef = useRef<HTMLModElement>(null);
  const viewportQuery = [
    minViewportWidth !== undefined ? `(min-width: ${minViewportWidth}px)` : '',
    maxViewportWidth !== undefined ? `(max-width: ${maxViewportWidth}px)` : '',
  ].filter(Boolean).join(' and ');
  const viewportClass = minViewportWidth !== undefined
    ? 'ad-slot-wide'
    : maxViewportWidth !== undefined
      ? 'ad-slot-mobile'
      : '';

  useEffect(() => {
    if (!slotId) return;

    const requestAdWhenEligible = () => {
      if (viewportQuery && !window.matchMedia(viewportQuery).matches) return;
      const ad = adRef.current;
      if (!ad || requestedAds.has(ad)) return;

      loadAdSense(ADSENSE_PUBLISHER_ID);
      requestedAds.add(ad);
      try {
        const browserWindow = window as Window & { adsbygoogle?: unknown[] };
        browserWindow.adsbygoogle = browserWindow.adsbygoogle || [];
        browserWindow.adsbygoogle.push({});
      } catch (error) {
        console.error('AdSense ad request failed:', error);
      }
    };

    requestAdWhenEligible();
    if (!viewportQuery) return;
    window.addEventListener('resize', requestAdWhenEligible);
    return () => window.removeEventListener('resize', requestAdWhenEligible);
  }, [slotId, viewportQuery]);

  // No unit ID means no request and no empty box before AdSense is configured.
  if (!slotId) return null;

  return (
    <aside aria-label="Advertisement" className={`${className} ${viewportClass}`}>
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A8174]">
        Advertisement
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle block min-w-0"
        style={{ display: 'block', width: '100%', minHeight: format === 'vertical' ? '250px' : '100px' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
