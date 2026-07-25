'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, X, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';

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
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.wishlist || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch wishlist');
      }
    } catch (err) {
      setError('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/wishlist?resourceId=${resourceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWishlist(wishlist.filter((item) => item.resourceId._id !== resourceId));
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((item) => (
              <div
                key={item._id}
                onClick={() => router.push(`/resource/${item.resourceId._id}`)}
                className="cursor-pointer w-full"
              >
                <ResourceCard
                  id={item.resourceId._id}
                  title={item.resourceId.title}
                  rating={item.resourceId.avgRating || 0}
                  reviewCount={item.resourceId.totalReviews || 0}
                  price={item.resourceId.price}
                  discount={item.resourceId.discount}
                  thumbnailUrl={item.resourceId.thumbnailUrl}
                  category={item.resourceId.category}
                  onGetResource={() => router.push(`/resource/${item.resourceId._id}`)}
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
