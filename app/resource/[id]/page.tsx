'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceDetailSkeleton from '@/components/ui/ResourceDetailSkeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Star, Loader2, Send, X, Share2, Heart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  category: string;
  linkType?: string;
  linkUrl?: string;
}

interface Review {
  _id: string;
  resourceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ResourceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isResourceWishlisted, refreshWishlist } = useWishlist();
  const [resource, setResource] = useState<Resource | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [openResourceLoading, setOpenResourceLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [reviewModalError, setReviewModalError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isWishlisted = isResourceWishlisted(params.id as string);
  const isFreeResource = resource?.price === 0;
  const galleryImages = resource?.images && resource.images.length > 0 ? resource.images : resource?.thumbnailUrl ? [resource.thumbnailUrl] : [];
  const currentImage = galleryImages[selectedImageIndex] || '/placeholder.png';
  const imageCount = galleryImages.length;

  // Prevent body scroll when modals are open
  useEffect(() => {
    const anyModalOpen = showImageModal || showReviewModal || deleteConfirmModal;
    
    if (anyModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [showImageModal, showReviewModal, deleteConfirmModal]);

  // Reset selected image when navigating between resources
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [params.id]);

  // Keyboard navigation for the image lightbox
  useEffect(() => {
    if (!showImageModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowImageModal(false);
      else if (e.key === 'ArrowLeft' && imageCount > 1) setSelectedImageIndex((i) => (i - 1 + imageCount) % imageCount);
      else if (e.key === 'ArrowRight' && imageCount > 1) setSelectedImageIndex((i) => (i + 1) % imageCount);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showImageModal, imageCount]);

  const openResource = async () => {
    if (!session) {
      (document.querySelector('[data-login-trigger="true"]') as HTMLButtonElement | null)?.click();
      return;
    }

    setOpenResourceLoading(true);
    try {
      const source = searchParams.get('ref') || 'direct';
      const response = await fetch(`/api/resources/${params.id}/open-drive?ref=${encodeURIComponent(source)}`);
      const data = await response.json();
      if (response.ok && data.driveUrl) window.open(data.driveUrl, '_blank');
      else alert(data.error || 'Failed to open resource');
    } catch {
      alert('Failed to open resource');
    } finally {
      setOpenResourceLoading(false);
    }
  };

  // Automatic tracking functions
  const trackEvent = async (eventType: 'page_view' | 'click' | 'purchase' | 'share' | 'time_on_page', additionalData?: any) => {
    try {
      const referrer = document.referrer;
      const currentSessionId = sessionId || crypto.randomUUID();
      
      if (!sessionId) {
        setSessionId(currentSessionId);
      }

      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: params.id,
          eventType,
          referrer,
          sessionId: currentSessionId,
          ...additionalData
        })
      });
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  // Track page view on mount - count on all navigation except refresh
  useEffect(() => {
    if (params.id) {
      setPageStartTime(Date.now());
      
      // Check if this is a page refresh (no referrer or referrer is the same page)
      const referrer = document.referrer;
      const isRefresh = !referrer || referrer.includes(window.location.href);
      
      // Only track if it's not a page refresh
      if (!isRefresh) {
        trackEvent('page_view');
      }
    }
  }, [params.id]);

  // Track time on page when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
      if (timeOnPage > 5) { // Only track if user spent more than 5 seconds
        trackEvent('time_on_page', { timeOnPage });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageStartTime, sessionId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showReviewModal || deleteConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReviewModal, deleteConfirmModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching resource for ID:', params.id);
        const [resourceRes, reviewsRes] = await Promise.all([
          fetch(`/api/resources/${params.id}`),
          fetch(`/api/reviews?resourceId=${params.id}`),
        ]);

        const resourceData = await resourceRes.json();
        const reviewsData = await reviewsRes.json();

        console.log('Resource response:', resourceData);
        console.log('Resource response status:', resourceRes.status);

        if (!resourceRes.ok) {
          throw new Error(resourceData.error || 'Failed to fetch resource');
        }

        setResource(resourceData.resource);
        setReviews(reviewsData.reviews || []);
        setAvgRating(reviewsData.avgRating || 0);

        // Check if user has purchased this resource
        if (session) {
          try {
            const purchasedRes = await fetch('/api/user/purchased-resources');
            if (purchasedRes.ok) {
              const purchasedData = await purchasedRes.json();
              const purchased = purchasedData.resources || [];
              const purchasedIds = purchased.map((r: any) => r._id);
              console.log('Purchased resources:', purchasedIds);
              console.log('Current resource ID:', params.id);
              console.log('Is purchased:', purchasedIds.includes(params.id));
              setIsPurchased(purchasedIds.includes(params.id));
            }
          } catch (err) {
            console.error('Error checking purchased status:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching resource:', err);
        setError(err instanceof Error ? err.message : 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, session]);

  const handleSubmitReview = async () => {
    console.log('handleSubmitReview called', { session, userRating, reviewComment, editingReviewId });
    
    if (!session || userRating === 0 || !reviewComment.trim()) {
      console.log('Validation failed', { session: !!session, userRating, reviewComment: reviewComment.trim() });
      setReviewModalError('Please select a rating and write a review');
      return;
    }

    setSubmittingReview(true);
    setReviewModalError(null);

    try {
      let response, data;

      if (editingReviewId) {
        // Update existing review
        const reviewData = {
          reviewId: editingReviewId,
          rating: userRating,
          comment: reviewComment,
          userName: session.user?.name || 'Anonymous',
        };
        
        console.log('Updating review:', reviewData);

        response = await fetch('/api/reviews', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        });
      } else {
        // Create new review
        const reviewData = {
          resourceId: params.id,
          userId: session.user?.email,
          userName: session.user?.name || 'Anonymous',
          rating: userRating,
          comment: reviewComment,
        };
        
        console.log('Creating review:', reviewData);

        response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        });
      }

      data = await response.json();
      console.log('Review response:', data, 'Status:', response.status);

      if (!response.ok) {
        console.error('API error:', data);
        throw new Error(data.error || 'Failed to submit review');
      }

      // Refresh reviews
      const reviewsRes = await fetch(`/api/reviews?resourceId=${params.id}`);
      const reviewsData = await reviewsRes.json();
      console.log('Refreshed reviews:', reviewsData);
      setReviews(reviewsData.reviews || []);
      setAvgRating(reviewsData.avgRating || 0);
      
      // Reset form
      setUserRating(0);
      setReviewComment('');
      setEditingReviewId(null);
      setShowReviewModal(false);
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setUserRating(review.rating);
    setReviewComment(review.comment);
    setEditingReviewId(review._id);
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteConfirmModal(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await fetch(`/api/reviews?reviewId=${reviewToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete review');
      }

      // Refresh reviews
      const reviewsRes = await fetch(`/api/reviews?resourceId=${params.id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews || []);
      setAvgRating(reviewsData.avgRating || 0);
    } catch (err) {
      console.error('Delete review error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setReviewToDelete(null);
    }
  };

  const toggleWishlist = async () => {
    if (!session) {
      // Prompt user to login
      const loginButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }

    setWishlistLoading(true);
    try {
      const response = isWishlisted 
        ? await fetch(`/api/wishlist?resourceId=${params.id}`, { method: 'DELETE' })
        : await fetch('/api/wishlist', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ resourceId: params.id }) 
          });

      if (response.ok) {
        await refreshWishlist();
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      // Track share event
      await trackEvent('share');
      
      // Generate tracking link automatically
      const trackingUrl = `${window.location.origin}/resource/${params.id}?ref=shared&sid=${sessionId || crypto.randomUUID()}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: resource?.title || 'Check out this resource',
            text: `Check out this amazing resource: ${resource?.title}`,
            url: trackingUrl,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(trackingUrl);
        alert('Tracking link copied to clipboard!');
      }
    } finally {
      setShareLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !resource) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      // Calculate current resource price (after any existing discount)
      const resourceAmount = resource.discount && resource.discount > 0
        ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
        : resource.price;

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, purchaseAmount: resourceAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not apply coupon.');

      // Check if final price would be below ₹1
      const finalPrice = Number((resourceAmount * (1 - data.coupon.discountPercentage / 100)).toFixed(2));
      if (finalPrice < 1) {
        throw new Error('This coupon would make the price below ₹1. Please use a smaller discount.');
      }

      setCouponCode(data.coupon.code);
      setCouponDiscount(data.coupon.discountPercentage);
      setCouponMessage(`${data.coupon.discountPercentage}% off applied — ${data.coupon.title}`);
    } catch (err) {
      setCouponDiscount(null);
      setCouponMessage(err instanceof Error ? err.message : 'Could not apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    // Track purchase initiation
    await trackEvent('click', { action: 'checkout_initiated' });

    if (!session) {
      // Trigger login modal
      const loginButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }

    setCheckoutLoading(true);
    const couponParam = couponDiscount ? `?coupon=${encodeURIComponent(couponCode)}` : '';
    router.push(`/checkout/${params.id}${couponParam}`);
  };

  if (loading) {
    return <ResourceDetailSkeleton />;
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Resource not found
            </h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Go back to home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Image Gallery */}
            <div className="order-1 lg:col-start-1 lg:row-start-1 min-w-0">
              <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
                {/* Main Image */}
                <div className="relative min-w-0 lg:flex-1">
                  <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
                    <img
                      src={currentImage}
                      alt={resource.title}
                      className="h-full w-full cursor-zoom-in object-contain"
                      onClick={() => setShowImageModal(true)}
                    />

                    {imageCount > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex - 1 + imageCount) % imageCount); }}
                          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 sm:p-2 text-gray-800 shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex + 1) % imageCount); }}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 sm:p-2 text-gray-800 shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <span className="absolute right-2 sm:right-3 top-2 sm:top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                          {selectedImageIndex + 1} / {imageCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Thumbnails — vertical column on desktop, horizontal scroller on mobile */}
                {imageCount > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x lg:w-[72px] lg:shrink-0 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:max-h-[32rem]">
                    {galleryImages.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-lg overflow-hidden border-2 transition-all snap-start ${
                          selectedImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={imageUrl}
                          alt={`${resource.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details & Price Block */}
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-3 sm:space-y-3 min-w-0">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {resource.category}
                  </span>
                  {isPurchased && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border-2 border-green-500">
                      PAID
                    </span>
                  )}
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className="ml-auto p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  {resource.title}
                </h1>
                {/* Overall Rating */}
                {avgRating > 0 && reviews.length > 0 && <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-base">
                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>}
              </div>

              {/* Price and Checkout */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {isFreeResource ? (
                      <div><p className="text-2xl font-bold text-emerald-600 md:text-3xl">Free</p><p className="mt-1 text-sm font-medium text-emerald-700">Instant access after login</p></div>
                    ) : resource.discount && resource.discount > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500 line-through">₹{resource.price}</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">
                          ₹{(resource.price * (1 - resource.discount / 100)).toFixed(2)}
                        </p>
                        <p className="text-sm text-red-500 font-semibold">{Math.round(resource.discount)}% OFF</p>
                      </div>
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold text-gray-900">
                        ₹{resource.price}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share"
                  >
                    {shareLoading ? (
                      <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <Share2 className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {paymentError && (
                  <div className="mb-4 p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold mb-1">Payment Notice</p>
                      <p className="text-red-600">{paymentError}</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-base">
                    {error}
                  </div>
                )}

                {!isFreeResource && <div className="mb-4 rounded-lg border border-blue-100 bg-white/75 p-3">
                  <label htmlFor="resource-coupon" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#475569]">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input
                      id="resource-coupon"
                      value={couponCode}
                      onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponDiscount(null); setCouponMessage(null); }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold uppercase text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="rounded-md bg-[#0F172A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50">
                      {couponLoading ? 'Checking' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && <p className={`mt-2 text-xs ${couponDiscount ? 'text-green-700' : 'text-red-600'}`}>{couponMessage}</p>}
                  {couponDiscount && <p className="mt-2 text-sm font-semibold text-green-700">You pay ₹{((resource.discount && resource.discount > 0 ? resource.price * (1 - resource.discount / 100) : resource.price) * (1 - couponDiscount / 100)).toFixed(2)} after {couponDiscount}% off.</p>}
                </div>}

                {isPurchased || isFreeResource ? (
                  <button
                    onClick={openResource}
                    disabled={openResourceLoading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {openResourceLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-5 w-5" />
                        <span>{isFreeResource ? 'Get Free Resource' : 'Open Resource'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-[var(--accent)] text-white py-3 rounded-lg hover:bg-[var(--accent-deep)] transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing payment...</span></> : <><ExternalLink className="h-5 w-5" /><span>Buy Resource</span></>}
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="min-w-0 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg flex items-center">
                  <span className="w-1 h-5 sm:h-6 bg-blue-600 rounded-full mr-2 sm:mr-3"></span>
                  Description
                </h3>
                <div 
                  className="min-w-0 max-w-none text-sm leading-relaxed text-gray-700 description-content sm:text-base"
                  dangerouslySetInnerHTML={{ __html: resource.description }}
                />
              </div>
            </div>

            {/* Comments Block */}
            <div className="order-3 mt-1 w-full min-w-0">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-3 sm:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                    <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                    Comments
                  </h3>
                  <button
                    onClick={() => {
                      if (!session) {
                        const loginButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
                        if (loginButton) {
                          loginButton.click();
                        }
                      } else {
                        setShowReviewModal(true);
                      }
                    }}
                    disabled={!!session && reviews.filter(r => r.userId === session.user?.email).length >= 2}
                    className={`${
                      !!session && reviews.filter(r => r.userId === session.user?.email).length >= 2
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    } px-4 py-2 rounded-lg transition-all font-medium flex items-center space-x-2 shadow-md hover:shadow-lg text-sm disabled:shadow-none`}
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {!!session && reviews.filter(r => r.userId === session.user?.email).length >= 2
                        ? 'Max 2 Comments'
                        : 'Write Review'}
                    </span>
                  </button>
                </div>

                {/* Existing Reviews */}
                {reviews.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {reviews.map((review) => (
                      <div key={review._id} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                        {/* Header: Name & Stars on Left, Date on Right */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            {/* Name (Scaled down for mobile, clamped to 1 line) */}
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
                              {review.userName}
                            </h4>
                            
                            {/* Stars (Below the name on mobile) */}
                            <div className="flex items-center gap-0.5 mt-0.5 sm:mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Date (Pushed to the top right, small text) */}
                          <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap ml-2 pt-0.5">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Review Text */}
                        <p className="text-xs sm:text-sm text-gray-700 mt-2 leading-relaxed break-words">
                          {review.comment}
                        </p>
                        
                        {session?.user?.email === review.userId && (
                          <div className="mt-2 flex gap-3">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="text-blue-600 text-xs sm:text-sm hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="text-red-600 text-xs sm:text-sm hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative w-full max-w-3xl">
            <div className="absolute -top-12 inset-x-0 flex items-center justify-between text-white">
              {imageCount > 1 ? (
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                  {selectedImageIndex + 1} / {imageCount}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => setShowImageModal(false)}
                className="transition-colors hover:text-gray-200"
                aria-label="Close preview"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {imageCount > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex - 1 + imageCount) % imageCount); }}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex + 1) % imageCount); }}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <img
              src={currentImage}
              alt={`${resource.title} - Image ${selectedImageIndex + 1}`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {editingReviewId ? 'Edit Your Review' : 'Write Your Review'}
                </h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setEditingReviewId(null);
                    setUserRating(0);
                    setReviewComment('');
                    setReviewModalError(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {reviewModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {reviewModalError}
                </div>
              )}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Your Rating</label>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      onClick={() => setUserRating(i + 1)}
                      className={`h-6 w-6 sm:h-8 sm:w-8 cursor-pointer hover:scale-110 transition-transform ${
                        i < userRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write a review..."
                  maxLength={200}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none text-xs sm:text-sm break-words"
                  rows={4}
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {reviewComment.length}/200 characters
                </div>
              </div>
              <div className="flex justify-end space-x-2 sm:space-x-3 pt-2 sm:pt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="px-3 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg text-xs sm:text-base"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal}
        onClose={() => {
          setDeleteConfirmModal(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <Footer />
    </div>
  );
}
