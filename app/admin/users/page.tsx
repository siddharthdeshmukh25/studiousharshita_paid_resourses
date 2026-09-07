'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Eye, MousePointer2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

type UserRow = { _id: string; name: string; email: string; image?: string; role: string; createdAt: string; visits: number; lastVisit: string | null; resourceOpens: number; country?: string; ipAddress?: string };

const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'No activity yet';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async (value = '') => {
    setLoading(true); setError('');
    try { 
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(value)}`); 
      const data = await response.json(); 
      if (!response.ok) throw new Error(data.error); 
      setUsers(data.users || []); 
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Could not load users'); 
    } finally { 
      setLoading(false); 
    }
  };
  
  useEffect(() => { 
    const timer = window.setTimeout(() => { void loadUsers(); }, 0); 
    return () => window.clearTimeout(timer); 
  }, []);

  return <AdminLayout>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Customers</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Users</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View customer profiles, visits and resource activity.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void loadUsers(query); }} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            placeholder="Search name or email" 
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900" 
          />
        </form>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard title="Registered users" value={users.length} icon={<Users className="h-5 w-5" />} />
        <KPICard title="Recorded page visits" value={users.reduce((sum, user) => sum + user.visits, 0)} icon={<Eye className="h-5 w-5" />} />
        <KPICard title="Resource opens" value={users.reduce((sum, user) => sum + user.resourceOpens, 0)} icon={<MousePointer2 className="h-5 w-5" />} />
      </div>
      
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
      
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">All users</h2>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">Click any user to see their complete activity.</p>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Website visits</th>
                <th className="px-5 py-3">Resource opens</th>
                <th className="px-5 py-3">Last seen</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-600 dark:text-gray-400">Loading users…</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    {user.country ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {user.country}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{user.visits}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{user.resourceOpens}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{formatDate(user.lastVisit)}</td>
                  <td className="px-5 py-3 text-right">
                    <button 
                      onClick={() => router.push(`/admin/users/${user._id}`)} 
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:border-blue-500 dark:border-gray-700"
                    >
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !users.length && (
                <tr><td colSpan={7} className="p-10 text-center text-gray-600 dark:text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AdminLayout>;
}