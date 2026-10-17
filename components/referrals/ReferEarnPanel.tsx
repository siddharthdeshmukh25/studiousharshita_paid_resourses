'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Loader2, MousePointerClick, ShoppingBag, Wallet, Clock, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type ReferralResource = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  referralEnabled: boolean;
  commissionPercent: number | null;
  clicks: number;
  buys: number;
  earned: number;
  pending: number;
};

type ReferralSale = {
  id: string;
  resourceTitle: string;
  buyerName: string;
  saleAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: 'earned' | 'pending' | 'failed';
  createdAt: string;
};

type ReferralData = {
  referralCode: string;
  referralEnabled: boolean;
  defaultPercent: number;
  totals: { clicks: number; salesCount: number; earned: number; pending: number };
  resources: ReferralResource[];
  sales: ReferralSale[];
};

const SALE_STATUS: Record<ReferralSale['status'], { label: string; className: string }> = {
  earned: { label: 'Earned', className: 'bg-[var(--accent-soft)] text-[var(--accent-deep)]' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6257]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

export default function ReferEarnPanel() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/referrals/me')
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Could not load referral data.');
        setData(body);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const linkFor = (resourceId: string) =>
    `${window.location.origin}/resource/${resourceId}?ref=${data?.referralCode ?? ''}`;

  const copyLink = async (resourceId: string) => {
    await navigator.clipboard.writeText(linkFor(resourceId));
    setCopiedId(resourceId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Could not load referral data.'}</div>;
  }

  const shareable = data.resources.filter((r) => r.referralEnabled && (r.isFree || r.commissionPercent !== null));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--accent-soft-2)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] p-5 text-white shadow-lg sm:p-7">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/80">
              <Gift className="h-4 w-4" /> Your earnings
            </p>
            <p className="mt-2 text-4xl font-bold sm:text-5xl">{formatPrice(data.totals.earned)}</p>              <p className="mt-1 text-sm text-white/80">
              {formatPrice(data.totals.pending)} pending · confirmed when the buyer&apos;s payment completes
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white/15 px-4 py-3">
              <p className="text-2xl font-bold">{data.totals.clicks}</p>
              <p className="text-xs text-white/80">Clicks</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3">
              <p className="text-2xl font-bold">{data.totals.salesCount}</p>
              <p className="text-xs text-white/80">Sales</p>
            </div>
          </div>
        </div>
      </section>

      {!data.referralEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The referral program is currently paused. Existing earnings are still tracked.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Total clicks" value={data.totals.clicks} />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Buys" value={data.totals.salesCount} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Commission earned" value={formatPrice(data.totals.earned)} />
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Your referral links</h2>
        <p className="mb-4 text-sm text-[#6B6257]">
          Share a link below. Buyers who purchase through it count as your referral. Each link is tied to one resource.
        </p>

        {shareable.length === 0 ? (
          <p className="text-sm text-[#6B6257]">No resources are open for referrals right now.</p>
        ) : (
          <ul className="space-y-3">
            {shareable.map((resource) => (
              <li key={resource.id} className="flex flex-col gap-3 rounded-lg border border-[var(--line)] p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {resource.thumbnailUrl ? (
                    <img src={resource.thumbnailUrl} alt="" loading="lazy" className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded-md bg-[var(--accent-soft)]" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1A1A1A]">{resource.title}</p>
                    <p className="text-xs text-[#6B6257]">
                      {resource.isFree ? `Free resource · ${resource.clicks} clicks · eligible paid-resource purchases earn commission` : `${resource.commissionPercent}% commission · ${resource.clicks} clicks · ${resource.buys} buys · ${formatPrice(resource.earned)} earned`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void copyLink(resource.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-deep)] transition-colors"
                >
                  {copiedId === resource.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedId === resource.id ? 'Copied' : 'Copy link'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Sales from your links</h2>
        {data.sales.length === 0 ? (
          <p className="text-sm text-[#6B6257]">No sales yet. Share your links to start earning.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#6B6257]">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Resource</th>
                  <th className="py-2 pr-3 font-semibold">Buyer</th>
                  <th className="py-2 pr-3 font-semibold">Sale</th>
                  <th className="py-2 pr-3 font-semibold">Your commission</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-[var(--line)]">
                    <td className="py-2.5 pr-3 font-medium text-[#1A1A1A]">{sale.resourceTitle}</td>
                    <td className="py-2.5 pr-3">{sale.buyerName}</td>
                    <td className="py-2.5 pr-3">{formatPrice(sale.saleAmount)}</td>
                    <td className="py-2.5 pr-3">
                      {formatPrice(sale.commissionAmount)} <span className="text-xs text-[#6B6257]">({sale.commissionPercent}%)</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${SALE_STATUS[sale.status].className}`}>
                        {sale.status === 'pending' && <Clock className="h-3 w-3" />}
                        {SALE_STATUS[sale.status].label}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#6B6257]">{new Date(sale.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
