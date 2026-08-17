'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceDetailSkeleton from '@/components/ui/ResourceDetailSkeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Star, Loader2, Send, X, Share2, Heart, ExternalLink } from 'lucide-react';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  thumbnailUrl: string;
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

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_self' }) => Promise<unknown>;
    };
    Razorpay?: any;
  }
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [reviewModalError, setReviewModalError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);

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

          // Check if resource is wishlisted
          try {
            const wishlistRes = await fetch('/api/wishlist');
            if (wishlistRes.ok) {
              const wishlistData = await wishlistRes.json();
              const wishlist = wishlistData.wishlist || [];
              const wishlistedIds = wishlist.map((item: any) => 
                typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id
              );
              setIsWishlisted(wishlistedIds.includes(params.id));
            }
          } catch (err) {
            console.error('Error checking wishlist status:', err);
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

    try {
      const response = isWishlisted 
        ? await fetch(`/api/wishlist?resourceId=${params.id}`, { method: 'DELETE' })
        : await fetch('/api/wishlist', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ resourceId: params.id }) 
          });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource?.title || 'Check out this resource',
          text: `Check out this amazing resource: ${resource?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      // Trigger login modal
      const loginButton = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
      return;
    }

    // Check if session is about to expire or has expired
    const sessionExpiry = session.expires;
    if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
      // Session expired, force logout
      await signOut({ callbackUrl: '/' });
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: params.id, couponCode: couponDiscount ? couponCode : undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific payment errors
        if (data.error === 'Payment gateway is not configured.' || data.error === 'Payment gateway not supported yet.') {
          throw new Error('Payment service is not available at this time. Please contact admin or try again later.');
        }
        
        // Handle unauthorized error - session expired
        if (response.status === 401) {
          await signOut({ callbackUrl: '/' });
          throw new Error('Your session has expired. Please login again.');
        }
        
        throw new Error(data.error || 'Failed to create order');
      }

      // Store Razorpay order ID if available
      if (data.razorpayOrderId) {
        setRazorpayOrderId(data.razorpayOrderId);
      }

      // Handle different payment gateways
      if (data.gateway === 'razorpay') {
        if (!window.Razorpay) {
          throw new Error('Razorpay checkout is still loading. Please try again in a moment.');
        }
        const options = {
          key: data.keyId,
          amount: data.amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          name: 'Studiousharshita',
          description: resource?.title,
          order_id: data.paymentSessionId,
          handler: function (response: any) {
            // Handle successful payment - pass both custom order ID and Razorpay order ID
            const returnUrl = `/payment/return?order_id=${data.orderId}`;
            if (data.razorpayOrderId) {
              window.location.href = `${returnUrl}&razorpay_order_id=${data.razorpayOrderId}`;
            } else {
              window.location.href = returnUrl;
            }
          },
          modal: {
            ondismiss: function() {
              // Handle when payment popup is closed/cancelled
              setCheckoutLoading(false);
              setPaymentError('Payment cancelled. You can try again when ready.');
            },
            onclose: function() {
              // Handle when payment popup is closed
              setCheckoutLoading(false);
            }
          },
          prefill: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          theme: {
            color: '#2563EB',
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (data.gateway === 'cashfree') {
        if (!window.Cashfree) {
          throw new Error('Cashfree checkout is still loading. Please try again in a moment.');
        }
        const cashfree = window.Cashfree({ mode: data.environment });
        await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: '_self' });
      } else {
        throw new Error('Payment gateway not supported yet.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate checkout';
      console.error('Checkout error:', errorMessage);
      setPaymentError(errorMessage);
      setCheckoutLoading(false);
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Thumbnail Block */}
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer" onClick={() => setShowImageModal(true)}>
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Details & Price Block */}
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-3 sm:space-y-3">
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
                    className="ml-auto p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  {resource.title}
                </h1>
                {/* Overall Rating */}
                <div className="flex items-center space-x-2">
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
                </div>
              </div>

              {/* Price and Checkout */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {resource.discount && resource.discount > 0 ? (
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
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
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

                <div className="mb-4 rounded-lg border border-blue-100 bg-white/75 p-3">
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
                </div>

                {isPurchased ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/resources/${params.id}/open-drive`);
                        const data = await response.json();
                        if (response.ok && data.driveUrl) {
                          window.open(data.driveUrl, '_blank');
                        } else {
                          alert(data.error || 'Failed to open resource');
                        }
                      } catch (error) {
                        alert('Failed to open resource');
                      }
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Open Resource</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-[#2563EB] text-white py-3 rounded-lg hover:bg-[#1D4ED8] transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing payment...</span></> : <><ExternalLink className="h-5 w-5" /><span>Buy Resource</span></>}
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg flex items-center">
                  <span className="w-1 h-5 sm:h-6 bg-blue-600 rounded-full mr-2 sm:mr-3"></span>
                  Description
                </h3>
                <div 
                  className="text-gray-700 leading-relaxed text-sm sm:text-base max-w-none description-content"
                  dangerouslySetInnerHTML={{ __html: resource.description }}
                />
              </div>
            </div>

            {/* Comments Block */}
            <div className="order-3 lg:col-start-1 lg:row-start-2 w-full mt-1">
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-2xl max-h-[80vh] w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              className="w-full h-full object-contain rounded-lg"
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
