'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2 } from 'lucide-react';

interface ActiveCoupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountPercentage?: number;
  discountAmount?: number;
  expiresAt: string | null;
}

function discountLabel(coupon: ActiveCoupon): string {
  if (coupon.discountType === 'percentage' && coupon.discountPercentage) {
    return `${Math.round(coupon.discountPercentage)}% OFF`;
  }
  if (coupon.discountType === 'fixed' && coupon.discountAmount) {
    return `₹${Math.round(coupon.discountAmount)} OFF`;
  }
  return 'DEAL';
}

function timeLeft(iso: string | null): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ending now';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/**
 * Flash offers strip for the home page: live coupons from /api/coupons/active,
 * click-to-copy code, urgency countdown. Renders nothing when no coupons are
 * running so the page rhythm stays clean.
 */
export default function OffersStrip() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-render every minute so the countdowns stay honest.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/coupons/active')
      .then((res) => res.json() as Promise<{ coupons: ActiveCoupon[] }>)
      .then((data) => {
        if (!cancelled) setCoupons(data.coupons || []);
      })
      .catch(() => {
        /* optional section — silence is fine */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* clipboard unavailable — the code is still visible to type manually */
    }
  };

  if (!loaded && coupons.length === 0) return null;
  if (coupons.length === 0) return null;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--butter-soft)]/70 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#B4544A]">⚡ limited time</p>
            <h2 className="font-serif-display mt-1 text-2xl italic text-[#1A1A1A] sm:text-3xl">offers running right now</h2>
          </div>
          <p className="text-xs font-semibold text-[#6B6257]">Tap a code to copy — apply it at checkout</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="group relative flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.05)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#B4544A] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                    {discountLabel(coupon)}
                  </span>
                  {coupon.expiresAt && (
                    <span className="text-[11px] font-bold text-[#B4544A]">{timeLeft(coupon.expiresAt)}</span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-sm font-bold text-[#1A1A1A]">{coupon.title}</p>
                {coupon.description && (
                  <p className="truncate text-xs text-[#6B6257]">{coupon.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(coupon.code)}
                aria-label={`Copy coupon code ${coupon.code}`}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--accent)] px-3 py-2 text-sm font-extrabold tracking-wide text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> {coupon.code}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => router.push('/resources?type=paid')}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-[#FAF6EF] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-deep)] hover:shadow-md"
          >
            Shop premium notes <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
