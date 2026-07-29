'use client';

import { BookOpen, Heart, LogOut, ShoppingCart, User } from 'lucide-react';
import SearchBar from '../resource/SearchBar';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import LoginModal from '../auth/LoginModal';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    setShowDropdown(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-[#FFFFFF]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <button onClick={() => router.push('/')} className="flex shrink-0 items-center gap-2.5 text-left group">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#2563EB] text-[#F8FAFC] group-hover:bg-[#1D4ED8] transition-colors">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="hidden min-[390px]:block text-base sm:text-lg font-bold tracking-normal text-[#0F172A]">studiousharshita</span>
            </button>

            <div className="hidden md:block flex-1 max-w-xl mx-6">
              <SearchBar />
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {session && (
                <button onClick={() => router.push('/wishlist')} aria-label="Wishlist" className="p-2 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#06B6D4] rounded-lg transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
              )}
              {session && (
                <button onClick={() => router.push('/cart')} aria-label="Cart" className="relative p-2 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-lg transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#06B6D4] px-1 text-[9px] font-bold text-white">0</span>
                </button>
              )}

              {status === 'loading' ? (
                <div className="h-9 w-20 rounded-lg bg-[#EFF6FF] animate-pulse" />
              ) : session ? (
                <div className="relative">
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-[#EFF6FF] transition-colors">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || 'User'} className="h-7 w-7 rounded-full border border-[#CBD5E1] object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#06B6D4] text-xs font-bold text-white">{session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}</span>
                    )}
                    <span className="hidden lg:block max-w-28 truncate text-sm font-medium text-[#1E293B]">{session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
                      <div className="border-b border-[#EFF6FF] px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{session.user?.name || session.user?.email}</p>
                        <p className="truncate text-xs text-[#64748B]">{session.user?.email}</p>
                      </div>
                      <button onClick={() => { router.push('/dashboard'); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><User className="h-4 w-4" />Dashboard</button>
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><LogOut className="h-4 w-4" />Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} data-login-trigger="true" className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors">Login</button>
              )}
            </div>
          </div>
          <div className="pb-3 md:hidden"><SearchBar /></div>
        </div>
      </nav>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
