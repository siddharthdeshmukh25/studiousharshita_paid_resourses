'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Resource {
  _id: string;
  title: string;
  thumbnailUrl: string;
  price: number;
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchResources = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/resources?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.resources || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchResources, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
        placeholder="Search resources..."
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => {
            setSearchQuery('');
            setSearchResults([]);
            setShowDropdown(false);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </button>
      )}

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((resource) => (
                <div
                  key={resource._id}
                  onClick={() => handleResourceClick(resource._id)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={resource.thumbnailUrl}
                      alt={resource.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                      <p className="text-xs text-gray-500">₹{resource.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No resources found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
