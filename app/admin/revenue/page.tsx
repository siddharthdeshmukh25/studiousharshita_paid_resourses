'use client';
import { useEffect, useState } from 'react';
import { IndianRupee, ReceiptText, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

type Data = { 
  summary: { revenue: number; orders: number; average: number }; 
  orders: { _id: string; amount: number; createdAt: string; gateway?: string; userId?: { name?: string; email?: string }; resourceId?: { title?: string } }[] 
};

export default function RevenuePage() { 
  const [data, setData] = useState<Data | null>(null); 
  const [error, setError] = useState(''); 
  
  useEffect(() => { 
    fetch('/api/admin/revenue')
      .then(async r => { 
        const json = await r.json(); 
        if (!r.ok) throw new Error(json.error); 
        setData(json); 
      })
      .catch(() => setError('Revenue data could not be loaded.')); 
  }, []); 
  
  return <AdminLayout>
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-green-600 dark:text-green-400">Finance</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Revenue</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Completed payments and recent orders.</p>
      </div>
      
      {error ? 
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</p> : 
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard title="Total revenue" value={`₹${data?.summary.revenue ?? 0}`} icon={<IndianRupee className="h-5 w-5"/>}/>
            <KPICard title="Completed orders" value={data?.summary.orders ?? 0} icon={<ReceiptText className="h-5 w-5"/>}/>
            <KPICard title="Average order value" value={`₹${Math.round(data?.summary.average ?? 0)}`} icon={<TrendingUp className="h-5 w-5"/>}/>
          </div>
          
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent transactions</h2>
            </div>
            <div className="overflow-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Gateway</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {data?.orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{order.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{order.userId?.email || 'No email'}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{order.resourceId?.title || 'Unknown'}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 capitalize">{order.gateway || 'Unknown'}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">₹{order.amount}</td>
                    </tr>
                  ))}
                  {!data?.orders.length && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500 dark:text-slate-400">No transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      }
    </div>
  </AdminLayout>;
}