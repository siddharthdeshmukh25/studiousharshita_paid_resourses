'use client';

import { ShoppingCart, Search, User, LogOut, Heart } from 'lucide-react';
import SearchBar from '../resource/SearchBar';
import { useSession, signIn, signOut } from 'next-auth/react';
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
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/')}
                className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity tracking-tight"
              >
                studiousharshita
              </button>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Wishlist Icon */}
              {session && (
                <button 
                  onClick={() => router.push('/wishlist')}
                  className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Heart className="h-6 w-6" />
                </button>
              )}

              {/* Cart Icon */}
              {session && (
                <button 
                  onClick={() => router.push('/cart')}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                    0
                  </span>
                </button>
              )}

              {/* Auth Section */}
              {status === 'loading' ? (
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              ) : session ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {session.user?.image ? (
                      <div className="h-8 w-8 rounded-full border-2 border-blue-500 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          className="h-8 w-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('Image failed to load:', session.user?.image);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-white font-semibold text-sm">${session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}</span>`;
                            }
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-400">
                        <span className="text-white font-semibold text-sm">
                          {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="hidden sm:block text-gray-700 font-medium">
                      {session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.name || session.user?.email}
                        </p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          router.push('/dashboard');
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  data-login-trigger="true"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-4">
            <SearchBar />
          </div>
        </div>
      </nav>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
