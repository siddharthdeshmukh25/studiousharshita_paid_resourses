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

  useEffect(() => {
    fetchResources();
  }, [selectedCategory]);

  const fetchResources = async () => {
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
  };

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-[#09090b] overflow-hidden pt-4 pb-6 md:pt-5 md:pb-7 border-b border-white/10">
        {/* Subtle CSS Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Glowing Orb in the center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-[10px] sm:text-xs font-medium mb-4 backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            Premium Study Resources
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Learn Better <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Study Smarter
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
            Access high-quality study materials, notes, and resources designed to accelerate your learning and help you achieve academic excellence.
          </p>
        </div>
      </section>

      {/* Filter/Sort Bar */}
      <section className="bg-white border-b border-gray-200 py-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-3 items-center pb-2 w-full custom-scrollbar">
            <span className="text-gray-900 font-medium whitespace-nowrap flex-shrink-0">Categories:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 w-full">
              {[...Array(8)].map((_, i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No resources found
              </h2>
              <p className="text-gray-600">
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
