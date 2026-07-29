'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Resource { _id: string; title: string; thumbnailUrl: string; price: number; }

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchResources = async () => {
      if (searchQuery.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return; }
      setLoading(true);
      try {
        const response = await fetch(`/api/resources?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.resources || []);
        setShowDropdown(true);
      } catch { setSearchResults([]); } finally { setLoading(false); }
    };
    const debounceTimer = setTimeout(searchResources, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResourceClick = (resourceId: string) => { router.push(`/resource/${resourceId}`); setSearchQuery(''); setShowDropdown(false); };

  return <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)} placeholder="Search study resources" className="block w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-9 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#06B6D4] focus:bg-white focus:outline-none" />
    {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>}
    {showDropdown && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
      {loading ? <div className="p-4 text-center"><div className="inline-block h-5 w-5 rounded-full border-2 border-[#E2E8F0] border-t-[#06B6D4] animate-spin" /></div> : searchResults.length > 0 ? searchResults.map((resource) => <button key={resource._id} onClick={() => handleResourceClick(resource._id)} className="flex w-full items-center gap-3 border-b border-[#F1F5F9] px-3 py-2.5 text-left last:border-0 hover:bg-[#F8FAFC] transition-colors"><img src={resource.thumbnailUrl} alt="" className="h-10 w-10 rounded object-cover bg-[#EFF6FF]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#0F172A]">{resource.title}</span><span className="text-xs text-[#64748B]">Rs. {resource.price}</span></span></button>) : <p className="p-4 text-center text-sm text-[#64748B]">No resources found</p>}
    </div>}
  </div>;
}
