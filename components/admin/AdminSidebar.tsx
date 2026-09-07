'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  IndianRupee, 
  Tag, 
  Ticket, 
  Settings, 
  BarChart3,
  RefreshCw,
  LifeBuoy,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  Lock,
  FileText
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// Fallback theme hook for when context is not available
function useThemeSafe() {
  try {
    return useTheme();
  } catch {
    return {
      theme: 'light' as const,
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/admin' },
  { id: 'resources', label: 'Resources', icon: <Package className="h-5 w-5" />, path: '/admin/resources' },
  { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" />, path: '/admin/users' },
  { id: 'revenue', label: 'Revenue', icon: <IndianRupee className="h-5 w-5" />, path: '/admin/revenue' },
  { id: 'payment-captures', label: 'Payment Captures', icon: <RefreshCw className="h-5 w-5" />, path: '/admin/payment-captures' },
  { id: 'support', label: 'Support', icon: <LifeBuoy className="h-5 w-5" />, path: '/admin/support' },
  { id: 'categories', label: 'Categories', icon: <Tag className="h-5 w-5" />, path: '/admin/categories' },
  { id: 'coupons', label: 'Coupons', icon: <Ticket className="h-5 w-5" />, path: '/admin/coupons' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, path: '/admin/analytics' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, path: '/admin/notifications' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin/settings' },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLockMessage, setShowLockMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeSafe();

  // Live unread badge for the notifications item
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const response = await fetch('/api/admin/notifications?limit=1');
        if (!response.ok) return;
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (item: NavItem) => {
    if (item.path) router.push(item.path);
    if (item.action) {
      if (pathname !== '/admin') router.push(`/admin?action=${item.action}`);
      else window.dispatchEvent(new CustomEvent('admin:navigate', { detail: item.action }));
    }
    setIsMobileOpen(false);
  };

  const getActiveItem = () => {
    if (pathname === '/admin/analytics') return 'analytics';
    if (pathname === '/admin/notifications') return 'notifications';
    if (pathname === '/admin/users') return 'users';
    if (pathname === '/admin/revenue') return 'revenue';
    if (pathname === '/admin/payment-captures') return 'payment-captures';
    if (pathname === '/admin/support') return 'support';
    if (pathname === '/admin/coupons') return 'coupons';
    if (pathname === '/admin/categories') return 'categories';
    if (pathname === '/admin/settings') return 'settings';
    if (pathname === '/admin/resources') return 'resources';
    return 'dashboard';
  };

  const activeItem = getActiveItem();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          admin-sidebar border-r backdrop-blur
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo section */}
        <div className="admin-sidebar-brand flex items-center justify-between px-5">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#b8ff00] text-[#071000]">
                <LayoutDashboard className="h-[18px] w-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-semibold tracking-[-0.04em] text-gray-900 dark:text-gray-100 leading-tight">ResourceOS</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">v2.0.0</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-[15px]
                transition-all duration-200
                ${activeItem === item.id
                  ? 'bg-[#b8ff00]/12 text-[#b8ff00]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
              {!isCollapsed && item.id === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Theme lock indicator */}
        <div className="admin-sidebar-footer p-3 relative">
          <button
            onClick={() => setShowLockMessage(!showLockMessage)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Dark mode is locked for admin panel"
          >
            <Moon className="h-5 w-5" />
            {!isCollapsed && (
              <span className="font-medium text-[15px]">
                Dark Mode
              </span>
            )}
            <Lock className="h-4 w-4 text-green-500 ml-auto" />
          </button>
          
          {/* Lock message popup */}
          {showLockMessage && (
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-lg bg-gray-800 text-white text-xs shadow-lg z-50">
              <p className="font-semibold mb-1">⚠️ Feature Under Development</p>
              <p className="text-gray-300">Light mode toggle is currently disabled for the admin panel. This feature will be available in a future update.</p>
              <button
                onClick={() => setShowLockMessage(false)}
                className="mt-2 text-green-400 hover:text-green-300 font-medium"
              >
                Got it
              </button>
            </div>
          )}

          {/* Developer Notes Button */}
          <button
            onClick={() => router.push('/admin/developer-notes')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2
              text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Developer Notes"
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && (
              <span className="font-medium text-[15px]">
                Developer Notes
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
