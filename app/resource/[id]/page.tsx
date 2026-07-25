'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Star, Download, Loader2, ShoppingCart, Send, X, Share2 } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourceRes, reviewsRes] = await Promise.all([
          fetch(`/api/resources/${params.id}`),
          fetch(`/api/reviews?resourceId=${params.id}`),
        ]);

        const resourceData = await resourceRes.json();
        const reviewsData = await reviewsRes.json();

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
              setIsPurchased(purchasedIds.includes(params.id));
            }
          } catch (err) {
            console.error('Error checking purchased status:', err);
          }
        }
      } catch (err) {
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
      setError('Please select a rating and write a review');
      return;
    }

    setSubmittingReview(true);
    setError(null);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource?.title || 'Check out this resource',
          text: resource?.description || 'Check out this amazing resource on studiousharshita',
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

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: params.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'studiousharshita',
        description: resource?.title,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/checkout', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: data.userId,
                resourceId: data.resourceId,
                finalPrice: data.finalPrice,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              router.push('/dashboard');
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
          } finally {
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = (window as any).Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', (response: any) => {
        setError('Payment failed. Please try again.');
        setCheckoutLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate checkout');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
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
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer" onClick={() => setShowImageModal(true)}>
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Details & Price Block */}
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-6">
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
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {resource.discount && resource.discount > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500 line-through">₹{resource.price}</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">
                          ₹{(resource.price * (1 - resource.discount / 100)).toFixed(2)}
                        </p>
                        <p className="text-sm text-red-500 font-semibold">{resource.discount}% OFF</p>
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

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-base">
                    {error}
                  </div>
                )}

                {isPurchased ? (
                  <button
                    onClick={() => window.location.href = `/api/download?resourceId=${params.id}`}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Download className="h-5 w-5" />
                    <span>View Resource</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>
                )}

                {!session && (
                  <p className="mt-3 text-center text-gray-500 text-base">
                    Login to purchase this resource
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg flex items-center">
                  <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  {resource.description}
                </p>
              </div>
            </div>

            {/* Comments Block */}
            <div className="order-3 lg:col-start-1 lg:row-start-2 w-full">
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
                          <button
                            onClick={() => handleEditReview(review)}
                            className="mt-2 text-blue-600 text-xs sm:text-sm hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
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
          <div className="relative max-w-4xl max-h-[90vh] w-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingReviewId ? 'Edit Your Review' : 'Write Your Review'}
                </h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setEditingReviewId(null);
                    setUserRating(0);
                    setReviewComment('');
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Your Rating</label>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      onClick={() => setUserRating(i + 1)}
                      className={`h-8 w-8 cursor-pointer hover:scale-110 transition-transform ${
                        i < userRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Write a review..."
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none text-sm sm:text-base break-words"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center space-x-2 transition-all font-medium shadow-lg"
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

      <Footer />
    </div>
  );
}
