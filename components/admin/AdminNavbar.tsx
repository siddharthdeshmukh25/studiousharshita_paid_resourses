'use client';

import { Bell, Search, User, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNavbar() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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
      <div className="flex h-[76px] items-center justify-between gap-3 px-5 sm:px-7">
        {/* Search */}
        <div className="flex-1 max-w-[290px] sm:max-w-[330px]">
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

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#b8ff00]">
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
