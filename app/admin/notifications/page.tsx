'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Loader2,
  CheckCheck,
  IndianRupee,
  CircleAlert,
  LifeBuoy,
  MessageSquare,
  Mail,
  RefreshCw,
  Settings,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'new_order', label: 'Orders' },
  { value: 'payment_failed', label: 'Payment failures' },
  { value: 'new_ticket', label: 'Support' },
  { value: 'new_contact', label: 'Contact' },
  { value: 'capture_failed', label: 'Captures' },
  { value: 'system', label: 'System' },
];

const TYPE_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  new_order: { label: 'New order', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: <IndianRupee className="h-4 w-4" /> },
  payment_failed: { label: 'Payment failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: <CircleAlert className="h-4 w-4" /> },
  new_ticket: { label: 'Support ticket', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: <LifeBuoy className="h-4 w-4" /> },
  ticket_reply: { label: 'Ticket reply', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: <MessageSquare className="h-4 w-4" /> },
  new_contact: { label: 'Contact message', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <Mail className="h-4 w-4" /> },
  capture_failed: { label: 'Capture failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: <RefreshCw className="h-4 w-4" /> },
  system: { label: 'System', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: <Settings className="h-4 w-4" /> },
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const response = await fetch(`/api/admin/notifications?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const markRead = async (notification: NotificationItem) => {
    if (notification.read) {
      if (notification.link) router.push(notification.link);
      return;
    }
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification._id }),
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      if (notification.link) router.push(notification.link);
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">
              Activity
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Orders, payment issues, support tickets and contact messages — all in one place.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setTypeFilter(type.value)}
              className={`px-2.5 py-1 rounded-md text-xs sm:px-3.5 sm:py-1.5 sm:rounded-lg sm:text-sm font-medium border transition-colors ${
                typeFilter === type.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 dark:bg-[#0d1413] dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* List */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#080d0d]">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] || TYPE_META.system;
                return (
                  <button
                    key={notification._id}
                    onClick={() => markRead(notification)}
                    className={`w-full flex items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#0d1413] sm:gap-4 sm:px-5 sm:py-4 ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <span className={`mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full sm:h-9 sm:w-9 ${meta.className}`}>
                      {meta.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notification.title}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>
                          {meta.label}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{notification.message}</span>
                      <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-2 flex-shrink-0">
                      {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                      {notification.link && <ArrowRight className="h-4 w-4 text-gray-400" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}