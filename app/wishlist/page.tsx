'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';
import PageSkeleton from '@/components/ui/PageSkeleton';
import { useWishlist } from '@/contexts/WishlistContext';

interface WishlistItem {
  _id: string;
  resourceId: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    price: number;
    discount?: number;
    category: string;
    avgRating?: number;
    totalReviews?: number;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, isLoading, error } = useWishlist();

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Heart className="h-6 w-6 md:h-8 md:w-8 text-red-500 mr-3 fill-red-500" />
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-4">Start adding resources you love!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg hover:bg-[var(--accent-deep)] transition-colors"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((item) => (
              <div
                key={item._id}
                onClick={() => router.push(`/resource/${(typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id)}`)}
                className="cursor-pointer w-full"
              >
                <ResourceCard
                  id={typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id}
                  title={typeof item.resourceId === 'string' ? '' : item.resourceId.title}
                  rating={typeof item.resourceId === 'string' ? 0 : (item.resourceId.avgRating || 0)}
                  reviewCount={typeof item.resourceId === 'string' ? 0 : (item.resourceId.totalReviews || 0)}
                  price={typeof item.resourceId === 'string' ? 0 : item.resourceId.price}
                  discount={typeof item.resourceId === 'string' ? undefined : item.resourceId.discount}
                  thumbnailUrl={typeof item.resourceId === 'string' ? undefined : item.resourceId.thumbnailUrl}
                  category={typeof item.resourceId === 'string' ? undefined : item.resourceId.category}
                  onGetResource={() => router.push(`/resource/${typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
