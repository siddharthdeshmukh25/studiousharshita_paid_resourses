'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Gift, Copy, Check, Sparkles } from 'lucide-react';
import EarningOpportunityCallout from '@/components/referrals/EarningOpportunityCallout';
import { formatPrice } from '@/lib/format';

type Props = {
  resourceId: string;
  price: number;
  refCode: string | null;
};

export default function ReferralBanner({ resourceId, price, refCode }: Props) {
  const { status } = useSession();
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);
  const [offerState, setOfferState] = useState<'loading' | 'enabled' | 'disabled' | 'error'>('loading');
  const [myCode, setMyCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const trackedRef = useRef<string | null>(null);

  // Record the click when the visitor arrived through someone's referral link.
  useEffect(() => {
    const activeRefCode = refCode;
    if (!activeRefCode || trackedRef.current === activeRefCode) return;
    trackedRef.current = activeRefCode;
    void fetch('/api/referrals/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: activeRefCode, resourceId }),
    }).catch(() => undefined);
  }, [refCode, resourceId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/referrals/offer?resourceId=${resourceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.commissionPercent === 'number') {
          setCommissionPercent(data.commissionPercent);
          setOfferState(data.commissionPercent > 0 ? 'enabled' : 'disabled');
        } else {
          setOfferState('disabled');
        }
      })
      .catch(() => {
        if (!cancelled) setOfferState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  // Once logged in, fetch the visitor's own referral code so the link can be shown here.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const loadCode = async () => {
      for (const endpoint of ['/api/referrals/code', '/api/referrals/me']) {
        try {
          const response = await fetch(endpoint, { cache: 'no-store' });
          const data = await response.json();
          if (response.ok && typeof data.referralCode === 'string') {
            if (!cancelled) setMyCode(data.referralCode);
            return;
          }
        } catch {
          // Try the dashboard endpoint as a fallback before showing a recovery link.
        }
      }
      if (!cancelled) setMyCode('');
    };
    void loadCode();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isFreeResource = price <= 0;
  if (!isFreeResource && offerState === 'disabled') return null;

  const earnAmount = commissionPercent === null ? null : Math.round((price * commissionPercent) / 100);
  const linkPath = myCode ? `${window.location.origin}/resource/${resourceId}?ref=${myCode}` : '';

  const copyLink = async () => {
    if (!myCode) return;
    try {
      await navigator.clipboard.writeText(linkPath);
    } catch {
      const input = document.createElement('textarea');
      input.value = linkPath;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const openLogin = () => {
    const loginTrigger = document.querySelector('[data-login-trigger="true"]') as HTMLButtonElement | null;
    if (loginTrigger) loginTrigger.click();
    else window.dispatchEvent(new CustomEvent('open-login-modal'));
  };

  if (isFreeResource) {
    return <EarningOpportunityCallout className="mb-4" />;
  }

  return (
    <section className="relative mb-4 overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-[#FFB950] via-[#FF8A3D] to-[#E8590C] p-4 text-white shadow-[0_18px_40px_-12px_rgba(232,89,12,0.55)] sm:p-5" style={{ transform: 'perspective(900px) rotateX(2deg)' }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/20" />
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/25 to-transparent" />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_rgba(0,0,0,0.2)] ring-1 ring-white/40"><Gift className="h-6 w-6 drop-shadow" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold tracking-tight sm:text-lg">Refer &amp; Earn</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#E8590C]"><Sparkles className="h-2.5 w-2.5" /> New</span>
          </div>
          <p className="mt-0.5 text-xs text-white/90 sm:text-sm">Earn <span className="font-bold">{commissionPercent ?? 0}%</span> (about <span className="font-bold">{formatPrice(earnAmount ?? 0)}</span>) when someone buys through your link.</p>
        </div>
      </div>
      {status === 'authenticated' ? (
        <div className="relative mt-3 space-y-2">
          {myCode ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-white/95 p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.18)]">
                <input
                  readOnly
                  value={linkPath}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 truncate bg-transparent px-2 text-xs font-semibold text-[#1A1A1A] outline-none sm:text-sm"
                />
                <button
                  onClick={() => void copyLink()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#E8590C] px-3 py-2 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 sm:text-sm"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              <Link href="/profile#refer-earn" className="inline-block text-xs font-bold underline underline-offset-2 hover:text-white/80 sm:text-sm">
                View my clicks, buyers &amp; earnings →
              </Link>
            </>
          ) : myCode === '' ? (
            <p className="text-xs text-white/90">
              Your link is ready in your dashboard.{' '}
              <Link href="/profile#refer-earn" className="font-bold underline underline-offset-2">Open Refer &amp; Earn →</Link>
            </p>
          ) : (
            <p className="text-xs text-white/90">Loading your link…</p>
          )}
        </div>
      ) : status === 'unauthenticated' ? (
        <button
          onClick={openLogin}
          className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#E8590C] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Login to get your link
        </button>
      ) : null}
    </section>
  );
}
