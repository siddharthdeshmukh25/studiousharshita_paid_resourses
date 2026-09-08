'use client';

import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export default function AdminLayout({ children, showNavbar = true }: AdminLayoutProps) {
  return (
    <div className="admin-shell min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main content area */}
        <main className="flex-1 min-w-0 min-h-screen lg:ml-0 flex flex-col">
          {showNavbar && <AdminNavbar />}
          <div className="admin-content flex-1 w-full max-w-[1540px] mx-auto px-4 py-5 sm:px-5 sm:py-6 lg:px-10 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
