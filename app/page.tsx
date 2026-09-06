'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';
import ResourceCardSkeleton from '@/components/resource/ResourceCardSkeleton';
import BlueDotLoader from '@/components/ui/BlueDotLoader';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Bookmark, Check, Sparkles } from 'lucide-react';

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Keep the active tab in the URL so refresh and browser Back preserve it.
  const resourceType: 'free' | 'paid' = searchParams.get('type') === 'paid' ? 'paid' : 'free';
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  // Cache each tab/category result for this visit. A browser refresh intentionally
  // creates a fresh cache and fetches the latest resources again.
  const resourcesCache = useRef<Record<string, Resource[]>>({});
  const activeRequestKey = useRef<string>('');

  async function fetchResources() {
    const cacheKey = `${resourceType}:${selectedCategory}`;
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
  }, [selectedCategory, resourceType]);

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  const setResourceType = (type: 'free' | 'paid') => {
    if (type === resourceType) return;
    router.replace(type === 'free' ? '/?type=free' : '/?type=paid');
  };

  return (
    <div className="academic-surface min-h-screen flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-gradient-to-r from-white via-[#F8FBFF] to-[#E7F1FF] py-12 sm:py-16">
        <div aria-hidden="true" className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#2563EB]/10" style={{ filter: 'blur(48px)' }} />
        <div aria-hidden="true" className="absolute right-[12%] top-0 h-full w-px bg-gradient-to-b from-transparent via-[#2563EB]/15 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl lg:max-w-[54%]">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">Designed for ambitious students</p>
            <h1 className="font-serif text-4xl italic leading-[1.08] text-[#0F172A] sm:text-5xl md:text-6xl">Everything you need to study, stay organized, and achieve more.</h1>
            <p className="mt-5 max-w-2xl font-[family-name:var(--font-poppins)] text-sm leading-7 text-[#64748B] sm:text-base">Carefully crafted digital resources to help you stay organized, build better study habits, and make steady progress toward your academic and career goals.</p>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 hidden h-[310px] w-[390px] -translate-y-1/2 lg:block xl:right-10">
            <div className="absolute inset-3 rounded-[42%] border border-white/70 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
            <div className="absolute bottom-3 left-1/2 h-8 w-64 -translate-x-1/2 rounded-full bg-[#2563EB]/15" style={{ filter: 'blur(12px)' }} />

            <div className="absolute left-7 top-16 h-44 w-28 -rotate-[16deg] rounded-xl bg-gradient-to-br from-[#1649B8] to-[#2563EB] p-3 shadow-lg">
              <div className="flex items-center justify-between text-white/90"><BookOpen className="h-5 w-5" /><span className="text-[8px] font-bold tracking-wider">STUDY</span></div>
              <div className="mt-8 h-px w-12 bg-white/40" />
              <p className="mt-2 text-sm font-bold leading-tight text-white">Focus<br />notes</p>
              <Bookmark className="absolute bottom-3 right-3 h-5 w-5 fill-[#FCD34D] text-[#FCD34D]" />
            </div>

            <div className="absolute left-[105px] top-5 w-[190px] rotate-[7deg] rounded-2xl border border-white/90 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">Weekly plan</span><Sparkles className="h-4 w-4 text-[#06B6D4]" /></div>
              <div className="mt-4 space-y-2.5">
                {['Review notes', 'Practice quiz', 'Plan tomorrow'].map((task, index) => (
                  <div key={task} className="flex items-center gap-2 text-[10px] font-medium text-[#475569]">
                    <span className={`grid h-4 w-4 place-items-center rounded-full ${index < 2 ? 'bg-[#DBEAFE] text-[#2563EB]' : 'border border-[#CBD5E1] text-transparent'}`}><Check className="h-2.5 w-2.5 stroke-[3]" /></span>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full w-2/3 rounded-full bg-[#06B6D4]" /></div>
            </div>

            <div className="absolute bottom-6 right-8 rotate-[-7deg] rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 shadow-md">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">Keep going</p>
              <p className="mt-1 text-xs font-bold text-[#0F172A]">Small steps, big goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="flex-1 py-9 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">Browse resources</p>
              <h2 className="mt-1 text-xl font-bold text-[#0F172A] sm:text-2xl">Find your next study resource</h2>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <div role="tablist" aria-label="Choose resource type" className="relative grid h-10 flex-1 grid-cols-2 rounded-xl bg-[#EAF1FB] p-1 sm:w-48 sm:flex-none">
                <span aria-hidden="true" className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out ${resourceType === 'free' ? 'translate-x-1' : 'translate-x-[calc(100%+3px)]'}`} />
                <button type="button" role="tab" aria-selected={resourceType === 'free'} onClick={() => setResourceType('free')} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceType === 'free' ? 'text-emerald-700' : 'text-[#64748B]'}`}>Free</button>
                <button type="button" role="tab" aria-selected={resourceType === 'paid'} onClick={() => setResourceType('paid')} className={`relative z-10 rounded-lg text-sm font-bold transition-colors ${resourceType === 'paid' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>Paid</button>
              </div>
            <div className="relative z-40 shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCategoryMenuOpen}
                onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#D7E0EC] bg-white py-2 pl-3 pr-2 text-sm shadow-sm transition-all hover:border-[#2563EB] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B] sm:inline">Category</span>
                <span className="max-w-20 truncate font-semibold text-[#0F172A] sm:max-w-28">{selectedCategory === 'All' ? 'All' : selectedCategory}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`ml-1 h-4 w-4 text-[#2563EB] transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {isCategoryMenuOpen && (
                <div role="listbox" aria-label="Filter resources by category" className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#D7E0EC] bg-white p-1.5 shadow-lg">
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
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-[#EFF6FF] font-semibold text-[#2563EB]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                      >
                        {category === 'All' ? 'All resources' : category}
                        {isSelected && <span aria-hidden="true" className="text-[#2563EB]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 min-[600px]:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 w-full">
              {[...Array(8)].map((_, i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
                No resources found
              </h2>
              <p className="text-[#64748B]">
                {resourceType === 'free' ? 'Free resources are coming soon' : 'Check back later for new resources'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 min-[600px]:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 w-full">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  onClick={() => handleResourceClick(resource._id)}
                  className="cursor-pointer w-full"
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
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center" role="status" aria-label="Loading"><BlueDotLoader className="h-20 w-20" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
