'use client';

import { LogOut, User, Search, X, Menu } from 'lucide-react';
import SearchBar from '../resource/SearchBar';
import SearchResults from '../resource/SearchResults';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import LoginModal from '../auth/LoginModal';
import { useRouter, usePathname } from 'next/navigation';

// Main horizontal navigation — editorial magazine style menu (rendered uppercase).
const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/resources', label: 'Resources' },
  { href: '/resources?type=paid', label: 'Shop' },
  { href: '/guides', label: 'Blog' },
  { href: '/support', label: 'Work With Me' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

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
      <nav className="sticky top-0 z-50 border-b border-[var(--line)] bg-[#FAF6EF]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
            <button onClick={() => router.push('/')} className="flex shrink-0 items-center gap-1.5 text-left" aria-label="Studious Harshita — home">
              <span aria-hidden="true" className="font-hand text-xl leading-none text-[var(--accent)]">✷</span>
              <span className="font-serif-display text-lg tracking-tight text-[#1A1A1A] sm:text-xl">
                studious<span className="italic text-[var(--accent)]">harshita</span><span className="text-[var(--accent)]">.</span>
              </span>
            </button>

            {/* Search bar lives in the header on desktop — always visible */}
            <div className="hidden md:block flex-1 max-w-md mx-6 relative search-container">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--background)] rounded-lg shadow border border-[var(--line)] z-[100] max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[#C9BFA9] scrollbar-track-transparent">
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

            {/* Horizontal nav menu (desktop) — small uppercase editorial labels */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href.split('?')[0]);
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-soft-2)] text-[var(--accent-deep)]'
                        : 'text-[#6B6257] hover:text-[#1A1A1A] hover:bg-[var(--sage-soft)]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {/* === DESKTOP (lg+): nav links visible, Sign In button, no hamburger === */}
              {session ? null : status === 'loading' ? (
                <div className="hidden lg:block h-9 w-20 rounded-lg bg-[var(--accent-soft)] animate-pulse" />
              ) : (
                <button onClick={() => setShowLoginModal(true)} data-login-trigger="true" className="hidden lg:inline-flex rounded-full border border-[#1A1A1A]/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  Sign in
                </button>
              )}
              {/* Editorial primary CTA — magazine-style charcoal pill */}
              <button
                onClick={() => router.push('/resources')}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#FAF6EF] transition-all hover:-translate-y-px hover:bg-[var(--accent-deep)] hover:shadow-md"
              >
                Explore Resources
              </button>

              {/* === MOBILE/TABLET (<lg): search icon + hamburger toggle === */}
              <button onClick={() => setShowSearchModal(true)} aria-label="Search" className="lg:hidden p-2 text-[#64748B] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] rounded-lg transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                className={`lg:hidden p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[#64748B] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'}`}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {status === 'loading' ? (
                <div className="h-8 w-16 sm:h-9 sm:w-20 rounded-lg bg-[var(--accent-soft)] animate-pulse" />
              ) : session ? (
                <div className="relative z-[60]">
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 sm:py-1.5 sm:pl-1.5 sm:pr-2 hover:bg-[var(--accent-soft)] transition-colors">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || 'User'} className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-none object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-[var(--sage)] text-xs font-bold text-white">{session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}</span>
                    )}
                    <span className="hidden lg:block max-w-28 truncate text-sm font-medium text-[#1E293B]">{session.user?.name?.split(' ')[0] || session.user?.email?.split('@')[0]}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-lg border-none bg-[#FFFDF8] py-1 shadow-lg">
                      <div className="border-b border-[var(--line)] px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{session.user?.name || session.user?.email}</p>
                        <p className="truncate text-xs text-[#64748B]">{session.user?.email}</p>
                      </div>
                      <button onClick={() => { router.push('/profile'); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><User className="h-4 w-4" />Profile</button>
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"><LogOut className="h-4 w-4" />Logout</button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Slide-down menu panel — mobile/tablet only, smooth height + fade animation */}
        <div
          className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isMenuOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="border-t border-[var(--line)] bg-[#FFFDF8] px-4 py-4 sm:px-6">
            <nav aria-label="Main menu" className="flex flex-col">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => { router.push(link.href); setIsMenuOpen(false); }}
                    className={`rounded-lg px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                      isActive ? 'bg-[var(--accent-soft-2)] text-[var(--accent-deep)]' : 'text-[#4A443B] hover:bg-[var(--sage-soft)]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
            {!session && status !== 'loading' && (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
                <button
                  onClick={() => { setIsMenuOpen(false); setShowLoginModal(true); }}
                  data-login-trigger="true"
                  className="rounded-full border border-[#1A1A1A]/25 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1A1A1A] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); setShowLoginModal(true); }}
                  className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#FDFBF6] transition-colors hover:bg-[var(--accent-deep)]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Search Modal for Mobile */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-[70] bg-[#FFFDF8] md:hidden flex flex-col" 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <div className="p-4 border-b border-[var(--line)]">
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
