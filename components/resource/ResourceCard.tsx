'use client';

import { Star, Heart, Download, CheckCircle, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ResourceCardProps {
  id: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  discount?: number;
  thumbnailUrl?: string;
  category?: string;
  authorName?: string;
  authorAvatar?: string;
  downloads?: number;
  updatedAt?: string;
  onGetResource?: () => void;
}

export default function ResourceCard({
  id,
  title,
  rating,
  reviewCount,
  price,
  discount,
  thumbnailUrl,
  category,
  authorName,
  authorAvatar,
  downloads,
  updatedAt,
  onGetResource,
}: ResourceCardProps) {
  const { data: session } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const finalPrice = discount && discount > 0 ? (price * (1 - discount / 100)).toFixed(2) : price;

  useEffect(() => {
    if (session) {
      checkWishlistStatus();
      checkCartStatus();
    }
  }, [id, session]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        const isInWishlist = data.wishlist.some((item: any) => {
          const resourceId = item.resourceId._id || item.resourceId;
          return resourceId === id;
        });
        setIsWishlisted(isInWishlist);
      } else {
        console.error('Wishlist API error:', response.status);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const checkCartStatus = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        const inCart = data.cart.some((item: any) => {
          const resourceId = item.resourceId._id || item.resourceId;
          return resourceId === id;
        });
        setIsInCart(inCart);
      } else {
        console.error('Cart API error:', response.status);
      }
    } catch (error) {
      console.error('Error checking cart status:', error);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!session) {
      // Trigger login modal
      const loginButton = document.querySelector('[data-login-trigger="true"]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }

    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist?resourceId=${id}`, { method: 'DELETE' });
        if (response.ok) {
          setIsWishlisted(false);
        } else {
          console.error('Remove from wishlist failed:', response.status);
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: id }),
        });
        if (response.ok) {
          setIsWishlisted(true);
        } else {
          const errorData = await response.json();
          console.error('Add to wishlist failed:', errorData);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const toggleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!session) {
      // Trigger login modal
      const loginButton = document.querySelector('[data-login-trigger="true"]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }

    try {
      if (isInCart) {
        const response = await fetch(`/api/cart?resourceId=${id}`, { method: 'DELETE' });
        if (response.ok) {
          setIsInCart(false);
        } else {
          console.error('Remove from cart failed:', response.status);
        }
      } else {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: id }),
        });
        if (response.ok) {
          setIsInCart(true);
        } else {
          const errorData = await response.json();
          console.error('Add to cart failed:', errorData);
        }
      }
    } catch (error) {
      console.error('Error toggling cart:', error);
    }
  };

  return (
    <div
      className="w-full flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full"
    >
      {/* Thumbnail Section */}
      <div className="w-full h-32 sm:h-44 md:h-52 relative overflow-hidden bg-gray-50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Thumbnail</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-100" />

        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-blue-600 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm">
            {category}
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
        </button>

        {/* Cart Button */}
        <button
          onClick={toggleCart}
          className="absolute top-2 right-10 sm:right-12 bg-white/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ShoppingCart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${isInCart ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Author Section */}
        {authorName && (
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="h-4 w-4 sm:h-6 sm:w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center">
                <span className="text-white text-[10px] sm:text-xs font-semibold">
                  {authorName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs sm:text-sm text-gray-600 flex items-center">
              {authorName}
              <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600 ml-1" />
            </span>
          </div>
        )}

        {/* Rating & Stats */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                    i < Math.floor(rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-xs font-semibold text-gray-900">
              {rating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
          {downloads && (
            <div className="flex items-center text-[9px] sm:text-xs text-gray-600">
              <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              {downloads}
            </div>
          )}
        </div>

        {/* Price & Button Footer */}
        <div className="mt-auto pt-2 sm:pt-3 flex items-center justify-between gap-1.5 border-t border-gray-50">
          <div className="flex flex-col min-w-0">
            {discount && discount > 0 && (
              <p className="text-[10px] sm:text-xs text-gray-500 line-through leading-none">₹{price}</p>
            )}
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-bold text-gray-900 leading-tight">₹{finalPrice}</span>
              <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-tight">Lifetime</span>
            </div>
          </div>
          <button
            onClick={onGetResource}
            className="flex-shrink-0 px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-sm font-semibold rounded-md sm:rounded-lg whitespace-nowrap transition-colors"
          >
            Get
          </button>
        </div>
      </div>
    </div>
  );
}
