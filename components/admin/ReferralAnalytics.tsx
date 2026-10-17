'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Users, MousePointerClick, ShoppingBag, Wallet, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type Referrer = { name: string; email: string; code: string; clicks: number; sales: number; earned: number; pending: number };
type Sale = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  buyerName: string;
  buyerEmail: string;
  resourceTitle: string;
  saleAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: 'earned' | 'pending' | 'failed';
  createdAt: string;
};
type Data = { totals: { clicks: number; sales: number; earned: number; pending: number }; referrers: Referrer[]; sales: Sale[] };

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">{icon}{label}</div>
    <p className="mt-2 text-xl font-semibold">{value}</p>
  </div>;
}

export default function ReferralAnalytics() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/referrals/analytics', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load referral analytics.');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load referral analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <section className="rounded-xl border border-slate-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold text-lg">Referral analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track referrer performance, buyer conversions and commissions.</p>
      </div>
      <button onClick={() => void load()} disabled={loading} aria-label="Refresh referral analytics" className="rounded-md border border-slate-200 p-2 hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
    {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading && !data ? <p className="py-8 text-center text-sm text-slate-500">Loading referral analytics…</p> : data && <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={data.totals.clicks} />
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Sales" value={data.totals.sales} />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Commission earned" value={formatPrice(data.totals.earned)} />
        <Metric icon={<Clock className="h-4 w-4" />} label="Commission pending" value={formatPrice(data.totals.pending)} />
      </div>
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Referrers</h3>
        {data.referrers.length === 0 ? <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-gray-700">No referral activity yet.</p> : <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-gray-800"><tr><th className="p-3">Referrer</th><th className="p-3">Code</th><th className="p-3">Clicks</th><th className="p-3">Sales</th><th className="p-3">Earned</th><th className="p-3">Pending</th></tr></thead>
            <tbody>{data.referrers.map((item) => <tr key={item.code || item.email} className="border-t border-slate-200 dark:border-gray-700"><td className="p-3"><span className="font-medium">{item.name}</span><span className="block text-xs text-slate-500">{item.email}</span></td><td className="p-3 font-mono">{item.code || '—'}</td><td className="p-3">{item.clicks}</td><td className="p-3">{item.sales}</td><td className="p-3">{formatPrice(item.earned)}</td><td className="p-3">{formatPrice(item.pending)}</td></tr>)}</tbody>
          </table>
        </div>}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Referred purchases</h3>
        {data.sales.length === 0 ? <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-gray-700">No referred purchases yet.</p> : <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-gray-800"><tr><th className="p-3">Referrer</th><th className="p-3">Buyer</th><th className="p-3">Resource</th><th className="p-3">Sale</th><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
            <tbody>{data.sales.map((sale) => <tr key={sale.id} className="border-t border-slate-200 dark:border-gray-700"><td className="p-3">{sale.referrerName}<span className="block text-xs text-slate-500">{sale.referrerEmail}</span></td><td className="p-3">{sale.buyerName}<span className="block text-xs text-slate-500">{sale.buyerEmail}</span></td><td className="p-3">{sale.resourceTitle}</td><td className="p-3">{formatPrice(sale.saleAmount)}</td><td className="p-3">{formatPrice(sale.commissionAmount)} ({sale.commissionPercent}%)</td><td className="p-3 capitalize">{sale.status}</td><td className="p-3">{new Date(sale.createdAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>}
  </section>;
}
