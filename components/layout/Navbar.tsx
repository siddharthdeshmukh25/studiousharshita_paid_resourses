'use client';

import { BookOpen, LogOut, User, ArrowLeft, Search, X } from 'lucide-react';
import SearchBar from '../resource/SearchBar';
import SearchResults from '../resource/SearchResults';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoginModal from '../auth/LoginModal';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Debug logging
  useEffect(() => {
    console.log('Navbar searchQuery:', searchQuery);
    console.log('Navbar showSearchModal:', showSearchModal);
  }, [searchQuery, showSearchModal]);

  // Load search history
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Track user location on login
  useEffect(() => {
    if (session?.user?.email && status === 'authenticated') {
      // Call location API to capture user's country and IP
      fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      }).catch((error) => {
        console.error('Failed to track user location:', error);
      });
    }
  }, [session, status]);

  // Listen for search from history event
  useEffect(() => {
    const handleSearchFromHistory = (e: CustomEvent) => {
      setSearchQuery(e.detail);
    };

    window.addEventListener('searchFromHistory', handleSearchFromHistory as EventListener);
    return () => {
      window.removeEventListener('searchFromHistory', handleSearchFromHistory as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
    setShowDropdown(false);
  };

  // Show/hide search results dropdown based on search query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Prevent body scroll when mobile search modal is open
  useEffect(() => {
    if (showSearchModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [showSearchModal]);

  // Handle Escape key to close search modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
      if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
      }
    };

    if (showSearchModal || showSearchResults) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchModal, showSearchResults]);

  // Handle swipe down to close modal
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showSearchModal) return;
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStart;
    
    if (diff > 100) { // Swipe down threshold
      setShowSearchModal(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-[#FFFFFF]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
            <button onClick={() => router.push('/')} className="flex shrink-0 items-center gap-2 text-left group">
              <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg bg-[var(--accent)] text-[#F8FAFC] group-hover:bg-[var(--accent-deep)] transition-colors">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-[#0F172A] font-inter">
                Studiousharshita
              </span>
            </button>

            <div className="hidden md:block flex-1 max-w-xl mx-6 relative search-container">
              <SearchBar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-50 rounded-lg shadow border border-gray-200 z-[100] max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <SearchResults 
                    searchQuery={searchQuery}
                    onResultClick={() => setShowSearchResults(false)}
                    searchHistory={searchHistory}
                    setSearchHistory={setSearchHistory}
                    showHistory={false}
                  />
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button onClick={() => setShowSearchModal(true)} aria-label="Search" className="md:hidden p-1.5 text-[#64748B] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-lg transition-colors">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              {pathname !== '/' && (
                <button onClick={() => router.back()} aria-label="Go back" className="hidden md:block p-1.5 text-[#64748B] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-lg transition-colors">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {status === 'loading' ? (
                <div className="h-8 w-16 sm:h-9 sm:w-20 rounded-lg bg-[var(--accent-soft)] animate-pulse" />
              ) : session ? (
                <div className="relative z-[60]">
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 sm:py-1.5 sm:pl-1.5 sm:pr-2 hover:bg-[var(--accent-soft)] transition-colors">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || 'User'} className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-none object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-[#06B6D4] text-xs font-bold text-white">{session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}</span>
                    )}
                    <span className="hidden lg:block max-w-28 truncate text-sm font-medium text-[#1E293B]">{session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-lg border-none bg-white py-1 shadow-lg">
                      <div className="border-b border-gray-200 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{session.user?.name || session.user?.email}</p>
                        <p className="truncate text-xs text-[#64748B]">{session.user?.email}</p>
                      </div>
                      <button onClick={() => { router.push('/profile'); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><User className="h-4 w-4" />Profile</button>
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><LogOut className="h-4 w-4" />Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowLoginModal(true)} data-login-trigger="true" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 sm:px-3.5 sm:py-2 text-sm font-semibold text-white hover:bg-[var(--accent-deep)] transition-colors">Login</button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Search Modal for Mobile */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-[70] bg-white md:hidden flex flex-col" 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSearchModal(false)}
                className="p-2 text-[#64748B] hover:bg-[var(--accent-soft)] rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <SearchBar 
                  onResultClick={() => setShowSearchModal(false)} 
                  isModal={true}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchHistory={searchHistory}
                  setSearchHistory={setSearchHistory}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SearchResults 
              searchQuery={searchQuery}
              onResultClick={() => setShowSearchModal(false)}
              searchHistory={searchHistory}
              setSearchHistory={setSearchHistory}
              showHistory={true}
            />
          </div>
        </div>
      )}
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
