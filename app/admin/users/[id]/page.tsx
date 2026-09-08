'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, MapPin, Globe, Clock, ShoppingBag, Eye, MousePointer2, Smartphone, Monitor, Tablet } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type UserDetail = {
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
    createdAt: string;
    country?: string;
    ipAddress?: string;
    visits: number;
    lastVisit: string | null;
    resourceOpens: number;
  };
  summary: {
    visits: number;
    interactions: number;
    resourceOpens: number;
    totalSpent: number;
  };
  orders: {
    _id: string;
    amount: number;
    createdAt: string;
    status: string;
    cashfreeOrderId: string;
    razorpayOrderId?: string;
    cashfreePaymentId?: string;
    gateway?: string;
    paymentCaptured?: boolean;
    resourceId?: { title?: string };
  }[];
  timeline: {
    id: string;
    type: string;
    label: string;
    timestamp: string;
    meta: string;
  }[];
};

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'page_view' | 'resource_open' | 'website_visit'>('all');

  useEffect(() => {
    loadUserData();
  }, [resolvedParams.id]);

  const loadUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users?id=${resolvedParams.id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load user profile');
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = data?.timeline.filter(item => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'page_view') return item.type === 'page_view';
    if (timelineFilter === 'resource_open') return item.type === 'resource_open';
    if (timelineFilter === 'website_visit') return item.type === 'page_view' && item.label.includes('visited');
    return true;
  }) || [];

  const formatDate = (date: string | null) => 
    date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Never';

  const getDeviceIcon = (meta: string) => {
    const lower = meta.toLowerCase();
    if (lower.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (lower.includes('tablet')) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600 dark:text-gray-400">Loading user profile…</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'User not found'}</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Go back
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 bg-gray-50 dark:bg-[#050909]">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#080D0D]/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-lime-600 dark:text-lime-400">Customer profile</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.user.name}</h1>
          </div>
        </div>

        {/* User Basic Info - Compact */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
          {data.user.image ? (
            <img
              src={data.user.image}
              alt={data.user.name}
              className="h-12 w-12 rounded-full border border-gray-200 dark:border-[#0f3d3d]/30"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 dark:bg-[#080D0D] dark:border-[#0f3d3d]/30 flex items-center justify-center text-lime-600 dark:text-lime-400 text-sm font-semibold">
              {data.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{data.user.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{data.user.email}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {data.user.country && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/30 dark:text-lime-400">
                {data.user.country}
              </span>
            )}
            <span>Joined {new Date(data.user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visits</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{data.summary.visits}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-[#080D0D]">
                <Eye className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Interactions</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{data.summary.interactions}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-[#080D0D]">
                <MousePointer2 className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Resource opens</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{data.summary.resourceOpens}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-[#080D0D]">
                <ShoppingBag className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total spent</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">₹{data.summary.totalSpent}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-[#080D0D]">
                <span className="text-sm font-bold text-lime-600 dark:text-lime-400">₹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History - Compact */}
        {data.orders.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-[#0f3d3d]/30 dark:bg-[#080D0D]">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-[#0f3d3d]/30">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-[#080D0D] dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Resource</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Payment ID</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#263232]/60">
                  {data.orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-100 dark:hover:bg-[#080D0D]/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                        {order.resourceId?.title || 'Unknown'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">₹{order.amount}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                        <span className="font-mono text-[11px]">
                          {order.razorpayOrderId || order.cashfreeOrderId || order.cashfreePaymentId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                          order.status === 'completed' || order.paymentCaptured
                            ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400'
                            : order.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {order.paymentCaptured ? 'Captured' : order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Timeline - Compact */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-[#263232] dark:bg-[#080D0D]">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-[#263232]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity Timeline</h3>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'page_view', 'resource_open', 'website_visit'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                      timelineFilter === filter
                        ? 'bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-900/40 dark:text-lime-400 dark:border-lime-900/50'
                        : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-100 dark:text-gray-400 dark:border-[#263232]/50 dark:hover:bg-[#080D0D]/50'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredTimeline.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-[#263232]/60">
                {filteredTimeline.map(item => (
                  <div key={item.id} className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#080D0D]/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`shrink-0 rounded p-1 ${
                        item.type === 'resource_open' 
                          ? 'bg-lime-100 dark:bg-lime-900/30' 
                          : item.type === 'page_view' 
                          ? 'bg-lime-100 dark:bg-lime-900/30'
                          : 'bg-gray-100 dark:bg-[#080D0D]'
                      }`}>
                        {getDeviceIcon(item.meta)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.label}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span className="text-gray-400 dark:text-gray-600">•</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                        item.type === 'resource_open'
                          ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400'
                          : item.type === 'page_view'
                          ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-[#080D0D] dark:text-gray-400'
                      }`}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">No activity found for this filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
