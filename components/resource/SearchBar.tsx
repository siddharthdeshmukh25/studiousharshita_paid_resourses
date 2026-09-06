'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onResultClick?: () => void;
  isModal?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchHistory?: string[];
  setSearchHistory?: (history: string[]) => void;
}

export default function SearchBar({ 
  onResultClick, 
  isModal = false,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  searchHistory: externalSearchHistory,
  setSearchHistory: externalSetSearchHistory
}: SearchBarProps = {}) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalSearchHistory, setInternalSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external or internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = externalSetSearchQuery || setInternalSearchQuery;
  const searchHistory = externalSearchHistory !== undefined ? externalSearchHistory : internalSearchHistory;
  const setSearchHistoryFn = externalSetSearchHistory || setInternalSearchHistory;

  // Debug logging
  useEffect(() => {
    console.log('SearchBar searchQuery:', searchQuery);
  }, [searchQuery]);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory && !externalSearchHistory) {
      setInternalSearchHistory(JSON.parse(savedHistory));
    }
  }, [externalSearchHistory]);

  useEffect(() => {
    if (isModal && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModal]);

  // Listen for search from history event
  useEffect(() => {
    const handleSearchFromHistory = (e: CustomEvent) => {
      setSearchQuery(e.detail);
    };

    window.addEventListener('searchFromHistory', handleSearchFromHistory as EventListener);
    return () => {
      window.removeEventListener('searchFromHistory', handleSearchFromHistory as EventListener);
    };
  }, [setSearchQuery]);

  return <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
    <input 
      ref={inputRef}
      type="text" 
      value={searchQuery} 
      onChange={(e) => setSearchQuery(e.target.value)} 
      placeholder="Search study resources" 
      className="block w-full rounded-lg border border-[#CBD5E1] bg-gray-50 py-2 pl-9 pr-9 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#06B6D4] focus:bg-white focus:outline-none transition-all" 
    />
    {searchQuery && <button onClick={() => { setSearchQuery(''); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>}
  </div>;
}
