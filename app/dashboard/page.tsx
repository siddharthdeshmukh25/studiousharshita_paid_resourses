'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';
import { Download, Loader2, Package, Calendar } from 'lucide-react';
import PageSkeleton from '@/components/ui/PageSkeleton';

interface PurchasedResource {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  category: string;
  purchasedAt: string;
  avgRating?: number;
  totalReviews?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [resources, setResources] = useState<PurchasedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    const fetchPurchasedResources = async () => {
      try {
        const response = await fetch('/api/user/purchased-resources');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch purchased resources');
        }

        setResources(data.resources || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchPurchasedResources();
    }
  }, [status, router]);

  const handleDownload = async (resourceId: string) => {
    setDownloading(resourceId);
    setError(null);

    try {
      const response = await fetch(`/api/download?resourceId=${resourceId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download resource');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resource-${resourceId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (status === 'loading' || loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              My Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {session?.user?.name || session?.user?.email}! Here are your purchased resources.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Resources Grid */}
          {resources.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No purchased resources yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring our collection of premium resources
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Resources
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
                >
                  {/* Thumbnail */}
                  <div className="h-44 md:h-48 overflow-hidden">
                    <img
                      src={resource.thumbnailUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 md:p-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] md:text-xs font-medium mb-2">
                      {resource.category}
                    </span>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                      {resource.description}
                    </p>

                    {/* Purchase Date */}
                    <div className="flex items-center text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Purchased on {new Date(resource.purchasedAt).toLocaleDateString()}
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(resource._id)}
                      disabled={downloading === resource._id}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                    >
                      {downloading === resource._id ? (
                        <>
                          <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 md:h-4 md:w-4" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
