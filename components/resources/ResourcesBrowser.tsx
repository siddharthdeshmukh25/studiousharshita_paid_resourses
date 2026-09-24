'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResourceCard from '@/components/resource/ResourceCard';
import ResourceCardSkeleton from '@/components/resource/ResourceCardSkeleton';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

/**
 * Full browse experience: free/paid tabs + category filter + resource grid.
 * Lives on /resources so the home page can stay a focused landing page.
 */
export default function ResourcesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Keep the active tab in the URL so refresh and browser Back preserve it.
  const resourceType: 'free' | 'paid' = searchParams.get('type') === 'paid' ? 'paid' : 'free';
  // Sort + rating filter are shared through the URL for the same reason.
  // Price sorting is meaningless on the free tab (everything is ₹0), so there it
  // falls back to newest.
  const rawSort = searchParams.get('sort') || 'newest';
  const sort = (
    resourceType === 'free' && rawSort.startsWith('price_') ? 'newest' : rawSort
  ) as 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating';
  const minRating = searchParams.get('minRating') === '4' ? 4 : 0;
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  // Cache each tab/category result for this visit. A browser refresh intentionally
  // creates a fresh cache and fetches the latest resources again.
  const resourcesCache = useRef<Record<string, Resource[]>>({});
  const activeRequestKey = useRef<string>('');

  async function fetchResources() {
    const cacheKey = `${resourceType}:${selectedCategory}:${sort}:${minRating}`;
    activeRequestKey.current = cacheKey;
    const cachedResources = resourcesCache.current[cacheKey];

    if (cachedResources) {
      setResources(cachedResources);
      if (selectedCategory === 'All') {
        setCategories(['All', ...Array.from(new Set(cachedResources.map((resource) => resource.category)))]);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ access: resourceType });
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (sort !== 'newest') params.set('sort', sort);
      if (minRating > 0) params.set('minRating', String(minRating));
      const url = `/api/resources?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json() as { resources: Resource[] };

      if (response.ok) {
        const fetchedResources = data.resources || [];
        resourcesCache.current[cacheKey] = fetchedResources;
        if (activeRequestKey.current === cacheKey) {
          setResources(fetchedResources);

          // Extract unique categories only when fetching all resources
          if (selectedCategory === 'All') {
            const categoryList: string[] = fetchedResources.map((r: Resource) => r.category);
            const uniqueCategories: string[] = ['All', ...Array.from(new Set(categoryList))];
            setCategories(uniqueCategories);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      if (activeRequestKey.current === cacheKey) setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, resourceType, sort, minRating]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `/resources?${qs}` : '/resources', { scroll: false });
  };

  const setSort = (next: typeof sort) => {
    updateQuery({ sort: next === 'newest' ? null : next });
  };

  const toggleMinRating = () => {
    updateQuery({ minRating: minRating > 0 ? null : '4' });
  };

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Only one dropdown may be open at a time — opening one closes the other.
  const toggleSortMenu = () => {
    setIsCategoryMenuOpen(false);
    setIsSortMenuOpen((open) => !open);
  };
  const toggleCategoryMenu = () => {
    setIsSortMenuOpen(false);
    setIsCategoryMenuOpen((open) => !open);
  };

  // Click (or tap) outside both dropdowns closes whichever is open.
  useEffect(() => {
    if (!isSortMenuOpen && !isCategoryMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideSort = sortMenuRef.current?.contains(target);
      const insideCategory = categoryMenuRef.current?.contains(target);
      if (!insideSort && !insideCategory) {
        setIsSortMenuOpen(false);
        setIsCategoryMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false);
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortMenuOpen, isCategoryMenuOpen]);

  const SORT_LABELS: Record<string, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    price_asc: 'Price: low to high',
    price_desc: 'Price: high to low',
    rating: 'Top rated',
  };

  // Free tab: everything is ₹0, so the price options make no sense there.
  const sortOptions = (Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).filter(
    (option) => resourceType === 'paid' || !option.startsWith('price_')
  );

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  const setResourceType = (type: 'free' | 'paid') => {
    if (type === resourceType) return;
    // Preserve sort/filter across tab switches; drop price sort on the free tab.
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    if (type === 'free' && (params.get('sort') || '').startsWith('price_')) params.delete('sort');
    const qs = params.toString();
    router.replace(qs ? `/resources?${qs}` : '/resources');
  };

  return (
    <section className="flex-1 py-9 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Browse resources</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Find your next study resource</h2>
          </div>
          {/* Mobile: tabs get their own full-width row, filters share the second.
              sm and up: everything sits compactly on one end-aligned row. */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
            <div role="tablist" aria-label="Choose resource type" className="relative grid h-9 w-full grid-cols-2 rounded-xl bg-[var(--accent-soft)] p-1 text-[13px] sm:h-10 sm:w-48 sm:text-sm">
              <span aria-hidden="true" className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-[var(--card-bg)] shadow-sm transition-transform duration-300 ease-out ${resourceType === 'free' ? 'translate-x-1' : 'translate-x-[calc(100%+3px)]'}`} />
              <button type="button" role="tab" aria-selected={resourceType === 'free'} onClick={() => setResourceType('free')} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceType === 'free' ? 'text-[var(--accent-deep)]' : 'text-[#64748B]'}`}>Free</button>
              <button type="button" role="tab" aria-selected={resourceType === 'paid'} onClick={() => setResourceType('paid')} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceType === 'paid' ? 'text-[var(--accent)]' : 'text-[#64748B]'}`}>Paid</button>
            </div>
            {/* Filters row: 4★+ chip + sort + category spread across the width on mobile */}
            <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none sm:justify-end">
            {/* Rating filter chip */}
            <button
              type="button"
              onClick={toggleMinRating}
              aria-pressed={minRating > 0}
              className={`flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[13px] shadow-sm transition-all sm:h-10 sm:gap-1.5 sm:px-3 sm:text-sm ${
                minRating > 0
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-bold text-[var(--accent-deep)]'
                  : 'border-[var(--line)] bg-[var(--card-bg)] text-[#64748B] hover:border-[var(--accent)]'
              }`}
              title="Show only resources rated 4 stars and above"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
              </svg>
              4★+
            </button>

            {/* Sort dropdown */}
            <div ref={sortMenuRef} className="relative z-40 shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isSortMenuOpen}
                onClick={toggleSortMenu}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--card-bg)] py-1.5 pl-2.5 pr-1.5 text-[13px] shadow-sm transition-all hover:border-[var(--accent)] hover:shadow focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] sm:h-10 sm:flex-none sm:gap-2 sm:py-2 sm:pl-3 sm:pr-2 sm:text-sm"
              >
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B] sm:inline">Sort</span>
                <span className="max-w-28 truncate font-semibold text-[#0F172A]">{SORT_LABELS[sort] || SORT_LABELS.newest}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`ml-1 h-4 w-4 text-[var(--accent)] transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {isSortMenuOpen && (
                <div role="listbox" aria-label="Sort resources" className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-bg)] p-1.5 shadow-lg">
                  {sortOptions.map((option) => {
                    const isSelected = sort === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSort(option as typeof sort);
                          setIsSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]/60'}`}
                      >
                        {SORT_LABELS[option]}
                        {isSelected && <span aria-hidden="true" className="text-[var(--accent)]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div ref={categoryMenuRef} className="relative z-40 shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCategoryMenuOpen}
                onClick={toggleCategoryMenu}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--card-bg)] py-1.5 pl-2.5 pr-1.5 text-[13px] shadow-sm transition-all hover:border-[var(--accent)] hover:shadow focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] sm:h-10 sm:flex-none sm:gap-2 sm:py-2 sm:pl-3 sm:pr-2 sm:text-sm"
              >
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B] sm:inline">Category</span>
                <span className="max-w-20 truncate font-semibold text-[#0F172A] sm:max-w-28">{selectedCategory === 'All' ? 'All' : selectedCategory}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`ml-1 h-4 w-4 text-[var(--accent)] transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {isCategoryMenuOpen && (
                <div role="listbox" aria-label="Filter resources by category" className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-bg)] p-1.5 shadow-lg">
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]/60'}`}
                      >
                        {category === 'All' ? 'All resources' : category}
                        {isSelected && <span aria-hidden="true" className="text-[var(--accent)]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
        {loading ? (
          <>
          {/* Spaced polaroid grid: even breathing room between cards on every breakpoint */}
          <div className="grid grid-cols-2 min-[600px]:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3 w-full">
            {[...Array(8)].map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
          </>
        ) : resources.length === 0 ? (
          <>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              No resources found
            </h2>
            <p className="text-[var(--text-secondary)]">
              {resourceType === 'free' ? 'Free resources are coming soon' : 'Check back later for new resources'}
            </p>
          </div>
          </>
        ) : (
          <>
          <div className="grid grid-cols-2 min-[600px]:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3 w-full">
            {resources.map((resource) => (
              <div
                key={resource._id}
                onClick={() => handleResourceClick(resource._id)}
                className="h-full cursor-pointer w-full"
              >
                <ResourceCard
                  id={resource._id}
                  title={resource.title}
                  rating={resource.avgRating || 0}
                  reviewCount={resource.totalReviews || 0}
                  price={resource.price}
                  discount={resource.discount}
                  thumbnailUrl={resource.thumbnailUrl}
                  images={resource.images}
                  category={resource.category}
                  onGetResource={() => handleResourceClick(resource._id)}
                />
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </section>
  );
}
