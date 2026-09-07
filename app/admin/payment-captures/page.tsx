'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

type CaptureOrder = {
  _id: string;
  cashfreeOrderId: string;
  razorpayOrderId?: string;
  amount: number;
  status?: string;
  captureStatus?: string;
  captureAttempts?: Date[];
  lastCaptureAttempt?: string;
  captureFailureReason?: string;
  gateway?: string;
  createdAt?: string;
  userId?: { name?: string; email?: string };
  resourceId?: { title?: string };
};

type BatchResult = {
  total: number;
  retried: number;
  successful: number;
  failed: number;
  skipped: number;
  details: {
    orderId: string;
    razorpayOrderId?: string;
    status: string;
    reason?: string;
    error?: string;
  }[];
};

type Tab = 'failed' | 'pending';

const formatDate = (date: string | Date | null | undefined) =>
  date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—';

const shortId = (id: string | undefined) => (id && id.length > 18 ? `${id.slice(0, 14)}…` : id || '—');

export default function PaymentCapturesPage() {
  const [tab, setTab] = useState<Tab>('failed');
  const [failed, setFailed] = useState<CaptureOrder[]>([]);
  const [pending, setPending] = useState<CaptureOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [failedRes, pendingRes] = await Promise.all([
        fetch('/api/admin/payment-captures?type=failed&limit=100'),
        fetch('/api/admin/payment-captures?type=pending&limit=100'),
      ]);
      const failedData = await failedRes.json();
      const pendingData = await pendingRes.json();
      if (!failedRes.ok || !pendingRes.ok) {
        throw new Error(failedData.error || pendingData.error || 'Could not load payment captures.');
      }
      setFailed(failedData.orders || []);
      setPending(pendingData.orders || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment captures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const retryOne = async (orderId: string) => {
    setRetrying(orderId);
    setError('');
    try {
      const response = await fetch('/api/admin/payment-captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'retry' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Retry failed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry capture.');
    } finally {
      setRetrying(null);
    }
  };

  const retryAll = async () => {
    setBatchRunning(true);
    setBatchResult(null);
    setError('');
    try {
      const response = await fetch('/api/admin/payment-captures/retry', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Batch retry failed.');
      setBatchResult(data.results);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run batch retry.');
    } finally {
      setBatchRunning(false);
    }
  };

  const orders = tab === 'failed' ? failed : pending;
  const amountAtRisk = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const totalAttempts = orders.reduce((sum, order) => sum + (order.captureAttempts?.length || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Finance</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Payment Captures</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Authorized Razorpay payments awaiting capture. Retry failed or pending captures manually.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => void retryAll()}
              disabled={batchRunning || (failed.length === 0 && pending.length === 0)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {batchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {batchRunning ? 'Retrying…' : 'Retry all eligible'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {batchResult && (
          <div className="rounded-xl border border-slate-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Batch retry finished
              </h2>
              <button onClick={() => setBatchResult(null)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                Dismiss
              </button>
            </div>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-slate-500">Scanned</p><p className="font-semibold">{batchResult.total}</p></div>
              <div><p className="text-xs text-slate-500">Retried</p><p className="font-semibold">{batchResult.retried}</p></div>
              <div><p className="text-xs font-medium text-blue-600 dark:text-blue-400">Captured</p><p className="font-semibold text-blue-600 dark:text-blue-400">{batchResult.successful}</p></div>
              <div><p className="text-xs text-slate-500">Failed / skipped</p><p className="font-semibold">{batchResult.failed} / {batchResult.skipped}</p></div>
            </div>
            {batchResult.details.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-xs dark:border-gray-700 dark:bg-gray-800">
                {batchResult.details.map((detail, index) => (
                  <div key={`${detail.orderId}-${index}`} className="flex items-start gap-2 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-gray-700">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-medium ${
                      detail.status === 'success'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : detail.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                    }`}>
                      {detail.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-slate-700 dark:text-slate-300">{shortId(detail.orderId)}</p>
                      {(detail.error || detail.reason) && <p className="mt-0.5 truncate text-slate-500">{detail.error || detail.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard title="Failed captures" value={failed.length} icon={<AlertTriangle className="h-5 w-5" />} />
          <KPICard title="Pending captures" value={pending.length} icon={<Clock className="h-5 w-5" />} />
          <KPICard title="Amount awaiting capture" value={`₹${amountAtRisk.toLocaleString('en-IN')}`} icon={<IndianRupee className="h-5 w-5" />} />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Captures needing attention</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Loading…'} · Razorpay only
              </p>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setTab('failed')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'failed' ? 'bg-red-500 text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Failed ({failed.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('pending')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'pending' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Pending ({pending.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-56 place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-blue-500/60" />
              <p className="mt-3 text-base font-medium text-gray-900 dark:text-gray-100">
                No {tab} captures 🎉
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {tab === 'failed' ? 'Every authorized Razorpay payment was captured successfully.' : 'No payments are waiting to be captured.'}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Attempts</th>
                    <th className="px-5 py-3">Last attempt</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{order.userId?.email || 'No email'}</p>
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-3 text-gray-700 dark:text-gray-300">
                        {order.resourceId?.title || 'Unknown'}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{shortId(order.cashfreeOrderId)}</p>
                        {order.razorpayOrderId && (
                          <p className="font-mono text-[10px] text-slate-400" title={order.razorpayOrderId}>{shortId(order.razorpayOrderId)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">₹{order.amount}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{order.captureAttempts?.length || 0}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                        {order.lastCaptureAttempt ? formatDate(order.lastCaptureAttempt) : formatDate(order.createdAt)}
                      </td>
                      <td className="max-w-[220px] px-5 py-3">
                        {order.captureFailureReason ? (
                          <span className="block truncate text-xs text-red-600 dark:text-red-400" title={order.captureFailureReason}>
                            {order.captureFailureReason}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Not attempted yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => void retryOne(order.cashfreeOrderId)}
                          disabled={retrying === order.cashfreeOrderId}
                          className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/60 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-500 hover:text-white disabled:opacity-50 dark:text-blue-400 dark:hover:text-white"
                        >
                          {retrying === order.cashfreeOrderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Batch retry processes Razorpay orders that are eligible per the retry schedule (max 3 attempts within 24 hours). The hourly cron job
          (<code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-white/10">/api/cron/payment-capture-retry</code>) does the same automatically.
        </p>
      </div>
    </AdminLayout>
  );
}