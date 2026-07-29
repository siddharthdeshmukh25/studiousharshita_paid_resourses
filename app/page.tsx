'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';
import ResourceCardSkeleton from '@/components/resource/ResourceCardSkeleton';
import { useRouter } from 'next/navigation';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  thumbnailUrl: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

export default function Home() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  async function fetchResources() {
    try {
      setLoading(true);
      const url = selectedCategory === 'All' 
        ? '/api/resources' 
        : `/api/resources?category=${selectedCategory}`;
      
      const response = await fetch(url);
      const data = await response.json() as { resources: Resource[] };

      if (response.ok) {
        setResources(data.resources || []);
        
        // Extract unique categories only when fetching all resources
        if (selectedCategory === 'All') {
          const categoryList: string[] = data.resources?.map((r: Resource) => r.category) || [];
          const uniqueCategories: string[] = ['All', ...Array.from(new Set(categoryList))];
          setCategories(uniqueCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [selectedCategory]);

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  return (
    <div className="academic-surface min-h-screen flex flex-col">
      <Navbar />

      <section className="border-b border-[#E2E8F0] bg-white/70 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">Curated for better learning</p>
          <h1 className="max-w-2xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-[#0F172A]">Study resources that help you move forward.</h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base leading-7 text-[#64748B]">High-quality notes and digital materials, selected to make your study time clearer, calmer, and more productive.</p>
        </div>
      </section>

      {/* Filter/Sort Bar */}
      <section className="sticky top-16 z-40 border-b border-[#E2E8F0] bg-[#FFFFFF]/95 py-3 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-2.5 items-center pb-1 w-full custom-scrollbar">
            <span className="text-[#2563EB] text-sm font-semibold whitespace-nowrap flex-shrink-0 mr-1">Categories</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap flex-shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-[#EFF6FF] text-[#334155] hover:bg-[#E0F2FE]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="flex-1 py-9 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 w-full">
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
                Check back later for new resources
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 w-full">
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
