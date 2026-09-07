'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistItem {
  _id: string;
  resourceId:
    | string
    | {
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

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  refreshWishlist: () => Promise<void>;
  isResourceWishlisted: (resourceId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    if (!session) {
      setWishlist([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [session]);

  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  const isResourceWishlisted = (resourceId: string): boolean => {
    return wishlist.some((item) => {
      const id = typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id;
      return id === resourceId;
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        error,
        refreshWishlist,
        isResourceWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
