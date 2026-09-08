'use client';

import { Bell, Search, User, LogOut, Loader2, CheckCheck, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON_CLASS: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  payment_failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  new_ticket: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ticket_reply: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  new_contact: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  capture_failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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

export default function AdminNavbar() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications?limit=8');
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadNotifications(), 0);
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotification = async (notification: NotificationItem) => {
    setShowNotifications(false);
    if (!notification.read) {
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
      } catch {
        /* ignore */
      }
    }
    if (notification.link) {
      router.push(notification.link);
    } else {
      router.push('/admin/notifications');
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

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/admin/resources?search=${encodeURIComponent(value)}`);
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.replace('/admin/login');
    }
  };

  return (
    <header className="admin-navbar sticky top-0 z-30 backdrop-blur">
      <div className="flex h-[76px] items-center justify-between gap-3 pl-16 pr-5 lg:px-7">
        {/* Search (hidden on small screens — not useful in mobile view) */}
        <div className="hidden sm:flex flex-1 max-w-[290px] sm:max-w-[330px]">
          <form className="relative" onSubmit={submitSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources, users, orders..."
              className="admin-search w-full rounded-md py-2 pl-10 pr-4 text-[15px] outline-none transition-all bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </form>
        </div>

        {/* Right side actions (ml-auto keeps them right-aligned on mobile, where search is hidden) */}
        <div className="ml-auto flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
              className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="admin-popover absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] sm:w-96 overflow-hidden rounded-lg z-50">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-3 py-2 sm:px-4 sm:py-3">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-sm">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        disabled={markingAll}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto sm:max-h-80">
                  {loadingNotifications ? (
                    <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => openNotification(notification)}
                        className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:gap-3 sm:px-4 sm:py-3 ${
                          !notification.read ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <span className={`mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold uppercase sm:h-7 sm:w-7 ${TYPE_ICON_CLASS[notification.type] || TYPE_ICON_CLASS.system}`}>
                          {notification.type === 'new_order' ? '₹' : notification.type.includes('ticket') || notification.type.includes('contact') ? '!' : '•'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-gray-900 dark:text-gray-100 truncate sm:text-sm">
                            {notification.title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 sm:line-clamp-2">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </span>
                        {!notification.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 p-1.5 sm:p-2">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      router.push('/admin/notifications');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors sm:py-2 sm:text-sm"
                  >
                    View all notifications
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#60A5FA]">
                <User className="h-4 w-4 text-[#101400]" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-gray-100">
                Admin
              </span>
            </button>

            {showProfileDropdown && (
              <div className="admin-popover absolute right-0 mt-2 w-48 rounded-md py-1 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button onClick={logout} disabled={isLoggingOut} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-60">
                  {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}