'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trash2, Package, Star } from 'lucide-react';

interface Resource {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  discount?: number;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

interface SearchResultsProps {
  searchQuery: string;
  onResultClick: () => void;
  searchHistory?: string[];
  setSearchHistory?: (history: string[]) => void;
  showHistory?: boolean;
}

export default function SearchResults({ searchQuery, onResultClick, searchHistory = [], setSearchHistory, showHistory = true }: SearchResultsProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('SearchResults searchQuery:', searchQuery);
    console.log('SearchResults resources:', resources);
  }, [searchQuery, resources]);

  // Search resources
  useEffect(() => {
    const searchResources = async () => {
      console.log('SearchResources called with query:', searchQuery);
      
      if (searchQuery.trim().length < 2) {
        setResources([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/resources?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        console.log('API response:', data);
        setResources(data.resources || []);
      } catch (error) {
        console.error('Search error:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchResources, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const clearHistory = () => {
    if (setSearchHistory) {
      setSearchHistory([]);
    }
    localStorage.removeItem('searchHistory');
  };

  const handleHistoryClick = (query: string) => {
    // This will be handled by parent component
    window.dispatchEvent(new CustomEvent('searchFromHistory', { detail: query }));
  };

  const handleResourceClick = (resourceId: string) => {
    // Save to history
    if (searchQuery.trim().length >= 2) {
      const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
      if (setSearchHistory) {
        setSearchHistory(updatedHistory);
      }
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
    
    router.push(`/resource/${resourceId}`);
    onResultClick();
  };

  // Show search history when no query
  if (searchQuery.trim().length < 2) {
    if (!showHistory) {
      return <div className="p-4"></div>;
    }
    return (
      <div className="p-4">
        {searchHistory.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">Recent Searches</h3>
              <button 
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(query)}
                  className="flex w-full items-center gap-3 px-4 py-3 bg-[#F8FAFC] rounded-xl text-left hover:bg-[#EFF6FF] transition-colors"
                >
                  <Clock className="h-4 w-4 text-[#94A3B8]" />
                  <span className="text-sm text-[#334155]">{query}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-[#CBD5E1] mx-auto mb-4" />
            <p className="text-sm text-[#64748B]">No recent searches</p>
            <p className="text-xs text-[#94A3B8] mt-1">Start searching to see your history</p>
          </div>
        )}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-transparent border-t-[#06B6D4] border-r-[#2563EB] border-b-[#F59E0B] border-l-[#10B981] animate-spin" />
        </div>
      </div>
    );
  }

  // Show search results
  return (
    <div className="py-1">
      {resources.length > 0 ? (
        <div className="flex flex-col gap-0">
          {resources.map((resource) => {
            const hasRating = Number(resource.avgRating) > 0 && Number(resource.totalReviews) > 0;
            return (
            <div
              key={resource._id}
              onClick={() => handleResourceClick(resource._id)}
              className="flex items-center gap-3 border-b border-gray-100 bg-white p-2 text-left transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <img
                  src={resource.thumbnailUrl}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className={`line-clamp-1 text-xs font-semibold text-[#0F172A] ${hasRating ? 'mb-0.5' : ''}`}>
                  {resource.title}
                </h3>
                {hasRating && (
                  <div className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-[10px] text-[#64748B]">{(resource.avgRating || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-[#94A3B8]">({resource.totalReviews})</span>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Package className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
          <p className="text-xs text-[#64748B]">No resources found</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">Try different keywords</p>
        </div>
      )}
    </div>
  );
}
