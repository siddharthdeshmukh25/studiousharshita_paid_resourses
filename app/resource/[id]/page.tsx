'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceDetailSkeleton from '@/components/ui/ResourceDetailSkeleton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Star, Loader2, Send, X, Share2, Heart, ExternalLink, ChevronLeft, ChevronRight, Eye, Package, Gift, Sparkles, Lock, RefreshCw, ShieldCheck, Check, ShoppingBag, Ticket, Zap, RotateCcw } from 'lucide-react';
import RelatedResources from '@/components/resource/RelatedResources';
import RecentlyViewed, { trackRecentlyViewed } from '@/components/resource/RecentlyViewed';
import QuickRatingModal from '@/components/resource/QuickRatingModal';
import { useToast } from '@/components/ui/Toast';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice, formatDiscountedPrice } from '@/lib/format';

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
  sampleUrl?: string;
  bundleResourceIds?: string[];
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
  const { toast } = useToast();
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
  const [hoverRating, setHoverRating] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bundleChildren, setBundleChildren] = useState<Array<{ _id: string; title: string; price: number; images?: string[]; thumbnailUrl?: string }>>([]);
  const [showReviewNudge, setShowReviewNudge] = useState(false);
  // Quick rating popup: fires once the student has genuinely explored the page —
  // opened the resource AND scrolled through ~70% of it.
  const [showQuickRating, setShowQuickRating] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickThanks, setQuickThanks] = useState(false);
  const [openedOnce, setOpenedOnce] = useState(false);
  const bottomReachedRef = useRef(false);
  const isWishlisted = isResourceWishlisted(params.id as string);
  // Reviews are owned by the MongoDB user id (what the API stores), so every
  // "is this my review?" check must compare ids — not the email.
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
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

  // Review nudge: signed-in users who have the resource (purchased or free) but
  // have not reviewed it yet get one gentle, dismissible reminder. Dismissal is
  // remembered per resource so we never nag twice.
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) return;
    if (!(isPurchased || isFreeResource)) return;
    if (reviews.some((review) => review.userId === currentUserId)) return;
    try {
      if (window.localStorage.getItem(`sh_review_nudge_${params.id}`)) return;
    } catch {
      /* storage unavailable — still fine to show once */
    }
    setShowReviewNudge(true);
  }, [session, status, isPurchased, isFreeResource, reviews, params.id, currentUserId]);

  const dismissReviewNudge = () => {
    setShowReviewNudge(false);
    try {
      window.localStorage.setItem(`sh_review_nudge_${params.id}`, '1');
    } catch {
      /* ignore */
    }
  };

  // Shared popup guards: never show if already rated this resource, already
  // shown/dismissed this session, not signed in, or not actually owned.
  const quickRatingBlocked = () => {
    if (!session?.user?.email) return true;
    if (!(isPurchased || isFreeResource)) return true;
    if (reviews.some((review) => review.userId === currentUserId)) return true;
    try {
      if (window.sessionStorage.getItem(`sh_quick_rating_${params.id}`) === '1') return true;
    } catch {
      /* ignore */
    }
    return false;
  };

  const fireQuickRating = () => {
    if (openedOnce) return;
    setOpenedOnce(true);
    setShowQuickRating(true);
    try {
      window.sessionStorage.setItem(`sh_quick_rating_${params.id}`, '1');
    } catch {
      /* ignore */
    }
  };

  // Scroll trigger — a full exploration CYCLE: the student reached the bottom
  // (95%+) and then scrolled back up (below 35%). Reaching the bottom alone
  // shows nothing; the popup waits until they come back up. One per session.
  useEffect(() => {
    if (status === 'loading') return;
    if (openedOnce) return;

    const handleScroll = () => {
      if (openedOnce) return;
      if (quickRatingBlocked()) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Needs a real scrollable page; short pages never trigger via scroll.
      if (scrollable <= 0) return;
      const depth = (window.scrollY / scrollable) * 100;

      if (depth >= 95) {
        bottomReachedRef.current = true;
        return;
      }
      // Cycle complete: touched the bottom earlier, now back near the top.
      if (bottomReachedRef.current && depth <= 35) {
        bottomReachedRef.current = false;
        fireQuickRating();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, isPurchased, isFreeResource, openedOnce, params.id, reviews, currentUserId]);

  const handleQuickRatingSubmit = async (rating: number, comment: string) => {
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: params.id,
          userName: session?.user?.name || 'Anonymous',
          rating,
          comment,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit rating');

      setQuickThanks(true);
      // Refresh the reviews list in the background.
      fetch(`/api/reviews?resourceId=${params.id}`)
        .then((res) => res.json())
        .then((reviewsData) => {
          setReviews(reviewsData.reviews || []);
          setAvgRating(reviewsData.avgRating || 0);
        })
      } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const closeQuickRating = () => {
    // Whether submitted or dismissed — never pop again for this resource
    // in this browser session.
    try {
      window.sessionStorage.setItem(`sh_quick_rating_${params.id}`, '1');
    } catch {
      /* ignore */
    }
    setShowQuickRating(false);
  };

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
      if (response.ok && data.driveUrl) {
        window.open(data.driveUrl, '_blank');
        // Open tracking: the popup is earned by repeated use — the 4th open in
        // this browser, or any open made 15+ minutes after the previous one
        // (a returning student). The first open never triggers it.
        let openCount = 0;
        let lastOpenAt = 0;
        try {
          openCount = Number(window.localStorage.getItem(`sh_open_count_${params.id}`) || '0') + 1;
          window.localStorage.setItem(`sh_open_count_${params.id}`, String(openCount));
          lastOpenAt = Number(window.localStorage.getItem(`sh_last_open_${params.id}`) || '0');
          window.localStorage.setItem(`sh_last_open_${params.id}`, String(Date.now()));
        } catch {
          /* ignore */
        }
        const returnedAfterLongTime = lastOpenAt > 0 && Date.now() - lastOpenAt > 15 * 60 * 1000;
        if (!quickRatingBlocked() && (returnedAfterLongTime || openCount >= 4)) {
          fireQuickRating();
        }
      } else alert(data.error || 'Failed to open resource');
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

        const loadedResource = resourceData.resource as Resource | null;
        if (loadedResource?._id) trackRecentlyViewed(loadedResource._id);
        if (loadedResource?.bundleResourceIds?.length) {
          // Resolve bundle children (title/price/cover) through the public ids endpoint.
          fetch(`/api/resources?ids=${encodeURIComponent(loadedResource.bundleResourceIds.join(','))}`)
            .then((res) => res.json() as Promise<{ resources?: Array<{ _id: string; title: string; price: number; images?: string[]; thumbnailUrl?: string }> }>)
            .then((data) => setBundleChildren(data.resources || []))
            .catch(() => setBundleChildren([]));
        } else {
          setBundleChildren([]);
        }

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
    if (!session || userRating === 0) {
      setReviewModalError('Please select a rating');
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
        // Create new review — identity comes from the server session.
        const reviewData = {
          resourceId: params.id,
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

      if (!response.ok) {
        throw new Error(data.error || 'Could not submit your review. Please try again.');
      }

      // Refresh reviews
      const reviewsRes = await fetch(`/api/reviews?resourceId=${params.id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews || []);
      setAvgRating(reviewsData.avgRating || 0);

      // Reset form + confirm with a themed toast
      setUserRating(0);
      setReviewComment('');
      setEditingReviewId(null);
      setShowReviewModal(false);
      setHoverRating(0);
      toast('success', editingReviewId ? 'Your review has been updated ♡' : 'Thanks for sharing! Your review is live ♡');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit your review. Please try again.';
      // API errors (like the 2-comment limit) surface as a themed toast near the
      // top of the screen; the modal stays open so nothing typed is lost.
      setReviewModalError(message);
      toast('error', message);
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
      toast('success', 'Your review has been deleted');
    } catch (err) {
      console.error('Delete review error:', err);
      toast('error', err instanceof Error ? err.message : 'Could not delete your review.');
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
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              Resource not found
            </h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-[var(--accent)] hover:text-[var(--accent-deep)] font-medium"
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
    <div className="min-h-screen flex flex-col bg-[var(--background)] overflow-x-hidden">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start lg:[grid-template-rows:auto_1fr]">
            {/* Image Gallery */}
            <div className="order-1 lg:col-start-1 lg:row-start-1 min-w-0">
              <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
                {/* Main Image */}
                <div className="relative min-w-0 lg:flex-1">
                  <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--sage-soft)] to-[var(--butter-soft)] shadow-sm">
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
                          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#FFFDF8]/90 p-1.5 sm:p-2 text-[#1A1A1A] shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[#FFFDF8]"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex + 1) % imageCount); }}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#FFFDF8]/90 p-1.5 sm:p-2 text-[#1A1A1A] shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[#FFFDF8]"
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
                          selectedImageIndex === index ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]' : 'border-[var(--line)] hover:border-[var(--line)]'
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
                  <span className="inline-block px-3 py-1 bg-[var(--accent-soft)] text-[var(--accent-deep)] rounded-full text-sm font-semibold">
                    {resource.category}
                  </span>
                  {isPurchased && (
                    <span className="inline-block px-3 py-1 bg-[var(--accent-soft)] text-[var(--accent-deep)] rounded-full text-sm font-bold border-2 border-[var(--accent)]">
                      PAID
                    </span>
                  )}
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className="ml-auto p-2 rounded-full bg-[#FFFDF8] border border-[var(--line)] hover:bg-[var(--background)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#A29785]" />
                    ) : (
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#A29785]'}`} />
                    )}
                  </button>
                </div>
                <h1 className="font-serif-display text-2xl md:text-4xl font-normal text-[#1A1A1A] mb-2 sm:mb-3 leading-tight">
                  <em className="italic">{resource.title}</em>
                </h1>
                {/* Overall Rating */}
                {avgRating > 0 && reviews.length > 0 && <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-[#D8CFC0]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[#6B6257] text-base">
                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>}
              </div>

              {/* Price and Checkout */}
              <div className="bg-gradient-to-br from-[var(--accent-soft)] to-[var(--butter-soft)] rounded-xl shadow-sm border border-[var(--accent-soft-2)] p-3.5 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    {isFreeResource ? (
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] shadow-sm sm:h-11 sm:w-11 sm:rounded-xl">
                          <Gift className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <p className="text-xl font-bold text-[var(--accent)] sm:text-2xl md:text-3xl">Free</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-deep)] sm:px-2.5 sm:py-1 sm:text-[11px]">
                              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              100% free
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-[var(--accent-deep)] sm:text-sm">Instant access after login</p>
                        </div>
                      </div>
                    ) : resource.discount && resource.discount > 0 ? (
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm text-[#6B6257] line-through">{formatPrice(resource.price)}</span>
                          <span className="text-xl font-bold text-[var(--accent)] sm:text-2xl md:text-3xl">
                            {formatDiscountedPrice(resource.price, resource.discount)}
                          </span>
                          <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 sm:text-[11px]">
                            {Math.round(resource.discount)}% off
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[var(--accent-deep)] sm:text-sm">
                          You save {formatPrice(Math.round(resource.price * (resource.discount / 100)))}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-[#1A1A1A] sm:text-2xl md:text-3xl">
                        {formatPrice(resource.price)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="p-2 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-soft-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Share"
                  >
                    {shareLoading ? (
                      <Loader2 className="h-5 w-5 text-[#6B6257] animate-spin" />
                    ) : (
                      <Share2 className="h-5 w-5 text-[#6B6257]" />
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

                {!isFreeResource && <div className="mb-3 sm:mb-4">
                  <div className="flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[#FFFDF8] p-1 pl-3.5 transition-all focus-within:border-[var(--accent)] focus-within:shadow-sm sm:h-10 sm:p-1.5 sm:pl-4">
                    <Ticket className="h-3.5 w-3.5 shrink-0 text-[var(--accent)] sm:h-4 sm:w-4" />
                    <input
                      id="resource-coupon"
                      aria-label="Coupon code"
                      value={couponCode}
                      onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponDiscount(null); setCouponMessage(null); }}
                      placeholder="Coupon code"
                      className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs font-semibold uppercase tracking-wide text-[#0F172A] outline-none placeholder:font-medium placeholder:text-[13px] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#A8A093] sm:text-[13px]"
                    />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="h-7 shrink-0 rounded-full bg-[var(--accent)] px-3 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:px-4 sm:text-xs">
                      {couponLoading ? 'Checking' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && <p className={`mt-2 text-xs ${couponDiscount ? 'text-[var(--accent-deep)]' : 'text-red-600'}`}>{couponMessage}</p>}
                  {couponDiscount && <p className="mt-2 text-sm font-semibold text-[var(--accent-deep)]">You pay {formatPrice(((resource.discount && resource.discount > 0 ? resource.price * (1 - resource.discount / 100) : resource.price) * (1 - couponDiscount / 100)))} after {couponDiscount}% off.</p>}
                </div>}

                {isPurchased || isFreeResource ? (
                  <>
                  <button
                    onClick={openResource}
                    disabled={openResourceLoading}
                    className={`w-full py-3 sm:py-3.5 rounded-xl text-sm sm:text-base text-white transition-all font-semibold flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFreeResource
                        ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] hover:brightness-110'
                        : 'bg-[var(--accent)] hover:bg-[var(--accent-deep)]'
                    }`}
                  >
                    {openResourceLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        {isFreeResource ? <Gift className="h-4 w-4 sm:h-5 sm:w-5" /> : <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />}
                        <span>{isFreeResource ? 'Get Free Resource' : 'Open Resource'}</span>
                      </>
                    )}
                  </button>
                  {isFreeResource && (
                    <>
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
                        {[{ icon: Lock, label: 'No card needed' }, { icon: RefreshCw, label: 'Lifetime access' }, { icon: ShieldCheck, label: 'Safe & secure' }].map(({ icon: Icon, label }) => (
                          <div
                            key={label}
                            className="flex flex-col items-center gap-1 rounded-lg border border-[var(--accent-soft-2)] bg-[#FFFDF8]/80 px-1.5 py-2 text-center transition-colors hover:border-[var(--accent)] sm:gap-1.5 sm:py-2.5"
                          >
                            <Icon className="h-3.5 w-3.5 text-[var(--accent)] sm:h-4 sm:w-4" />
                            <span className="text-[10px] font-semibold leading-tight text-[#4A443B] sm:text-[11px]">{label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#6B6257] sm:mt-2.5 sm:text-xs">
                        <Check className="h-3 w-3 text-[var(--accent)] sm:h-3.5 sm:w-3.5" />
                        Just log in and it&apos;s yours — no hidden steps
                      </p>
                    </>
                  )}
                  </>
                ) : (
                  <>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white py-3 rounded-xl hover:brightness-110 transition-all font-semibold text-sm sm:text-base sm:py-3.5 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? <><Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" /><span>Processing payment...</span></> : <><ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" /><span>Buy Resource</span></>}
                  </button>
                  {resource.sampleUrl && (
                    <a
                      href={resource.sampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full bg-[#FFFDF8] border-2 border-[var(--accent)] text-[var(--accent-deep)] py-2.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors font-semibold flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Free Sample</span>
                    </a>
                  )}
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
                    {[{ icon: ShieldCheck, label: 'Secure payment' }, { icon: Zap, label: 'Instant access' }, { icon: RotateCcw, label: 'Easy refunds' }].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-[var(--accent-soft-2)] bg-[#FFFDF8]/80 px-1.5 py-2 text-center transition-colors hover:border-[var(--accent)] sm:gap-1.5 sm:py-2.5">
                        <Icon className="h-3.5 w-3.5 text-[var(--accent)] sm:h-4 sm:w-4" />
                        <span className="text-[10px] font-semibold leading-tight text-[#4A443B] sm:text-[11px]">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#6B6257] sm:mt-2.5 sm:text-xs">
                    <Check className="h-3 w-3 text-[var(--accent)] sm:h-3.5 sm:w-3.5" />
                    One-time payment — lifetime access
                  </p>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="min-w-0 overflow-hidden bg-gradient-to-br from-[var(--accent-soft)] to-[var(--butter-soft)] rounded-2xl p-4 sm:p-6 border border-[var(--accent-soft-2)]">
                <h3 className="font-semibold text-[#1A1A1A] mb-2 sm:mb-3 text-base sm:text-lg flex items-center">
                  <span className="w-1 h-5 sm:h-6 bg-[var(--accent)] rounded-full mr-2 sm:mr-3"></span>
                  Description
                </h3>
                <div 
                  className="min-w-0 max-w-none text-sm leading-relaxed text-[#4A443B] description-content sm:text-base"
                  dangerouslySetInnerHTML={{ __html: resource.description }}
                />
              </div>

              {/* Bundle contents — what you get when you buy this combo */}
              {bundleChildren.length > 0 && (
                <div className="bg-gradient-to-br from-[var(--butter-soft)] to-[var(--accent-soft)] rounded-2xl p-4 sm:p-6 border border-[var(--accent-soft-2)]">
                  <h3 className="font-semibold text-[#1A1A1A] mb-1 text-base sm:text-lg flex items-center">
                    <Package className="mr-2 h-5 w-5 text-[var(--accent)]" />
                    What&apos;s inside this bundle
                  </h3>
                  <p className="mb-4 text-xs text-[#6B6257]">All of these unlock together with one purchase.</p>
                  <ul className="space-y-2">
                    {bundleChildren.map((child) => {
                      const childCover = child.images && child.images.length > 0 ? child.images[0] : child.thumbnailUrl;
                      return (
                        <li key={child._id}>
                          <a
                            href={`/resource/${child._id}`}
                            className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-2.5 transition-all hover:border-[var(--accent)] hover:shadow-sm"
                          >
                            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--accent-soft)]">
                              {childCover ? (
                                <img src={childCover} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 text-[var(--accent)]" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-[#1A1A1A]">{child.title}</span>
                              <span className="block text-xs text-[#6B6257]">{formatPrice(child.price)} value</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#A29785]" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm font-bold text-[var(--accent-deep)]">
                    Total value {formatPrice(bundleChildren.reduce((sum, child) => sum + (child.price || 0), 0))} — bundle price {formatPrice(resource.discount && resource.discount > 0 ? resource.price * (1 - resource.discount / 100) : resource.price)}
                  </p>
                </div>
              )}
            </div>

            {/* Comments Block — desktop: pinned under the image (left column row 2) + sticky while the long details column scrolls; mobile: after details */}
            <div className="order-3 mt-1 w-full min-w-0 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-start lg:sticky lg:top-20">
              <div className="bg-gradient-to-br from-[var(--sage-soft)] to-[var(--accent-soft)] rounded-2xl p-3 sm:p-6 border border-[var(--line)]">
                {/* Review nudge — one-time, dismissible, per resource */}
                {showReviewNudge && (
                  <div className="mb-3 rounded-xl border-2 border-dashed border-[var(--accent)] bg-[#FFFDF8] p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-hand text-lg leading-snug text-[#1A1A1A]">
                        enjoying the notes? ♡ tell other students how they were —
                      </p>
                      <button
                        onClick={dismissReviewNudge}
                        aria-label="Dismiss review reminder"
                        className="shrink-0 rounded-full p-1 text-[#A29785] transition-colors hover:bg-[var(--accent-soft)] hover:text-[#1A1A1A]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
                      >
                        ⭐ Rate this resource
                      </button>
                      <button
                        onClick={dismissReviewNudge}
                        className="text-xs font-medium text-[#6B6257] transition-colors hover:text-[#1A1A1A]"
                      >
                        Maybe later
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-[#A29785]">Takes 20 seconds — it genuinely helps other students decide. ♡</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1A1A1A] text-lg flex items-center">
                    <span className="w-1 h-6 bg-[var(--accent)] rounded-full mr-3"></span>
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
                        ? 'bg-[#D8CFC0] text-[#6B6257] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] text-white hover:from-[var(--accent-deep)] hover:to-[var(--accent)]'
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
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C9BFA9] scrollbar-track-[var(--accent-soft)] hover:scrollbar-thumb-[var(--accent)]">
                    {reviews.map((review) => (
                      <div key={review._id} className="bg-[#FFFDF8] p-3 sm:p-4 rounded-xl border border-[var(--line)] shadow-sm">
                        {/* Header: Name & Stars on Left, Date on Right */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            {/* Name (Scaled down for mobile, clamped to 1 line) */}
                            <h4 className="text-sm sm:text-base font-bold text-[#1A1A1A] line-clamp-1">
                              {review.userName}
                            </h4>
                            
                            {/* Stars (Below the name on mobile) */}
                            <div className="flex items-center gap-0.5 mt-0.5 sm:mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#D8CFC0]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Date (Pushed to the top right, small text) */}
                          <span className="text-[10px] sm:text-xs text-[#6B6257] whitespace-nowrap ml-2 pt-0.5">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Review Text — rating-only reviews have no comment */}
                        {review.comment && (
                          <p className="text-xs sm:text-sm text-[#4A443B] mt-2 leading-relaxed break-words">
                            {review.comment}
                          </p>
                        )}
                        
                        {currentUserId && review.userId === currentUserId && (
                          <div className="mt-2 flex gap-3">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="text-[var(--accent)] text-xs sm:text-sm hover:text-[var(--accent-deep)] font-medium"
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
                    <p className="text-[#6B6257] text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related resources + recently viewed shelves */}
          <RelatedResources resourceId={params.id as string} />
          <RecentlyViewed currentResourceId={params.id as string} />
        </div>
      </main>

      {/* Image Lightbox */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative w-full max-w-3xl">
            <div className="absolute -top-12 inset-x-0 flex items-center justify-between text-white">
              {imageCount > 1 ? (
                <span className="rounded-full bg-[#FFFDF8]/15 px-3 py-1 text-sm font-semibold">
                  {selectedImageIndex + 1} / {imageCount}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => setShowImageModal(false)}
                className="transition-colors hover:text-[var(--butter)]"
                aria-label="Close preview"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {imageCount > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex - 1 + imageCount) % imageCount); }}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#FFFDF8]/20 p-2 text-white transition-colors hover:bg-[#FFFDF8]/40"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((selectedImageIndex + 1) % imageCount); }}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#FFFDF8]/20 p-2 text-white transition-colors hover:bg-[#FFFDF8]/40"
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

      {/* Quick Rating Popup — fires when the user returns from the opened file */}
      <QuickRatingModal
        isOpen={showQuickRating}
        resourceName={resource?.title || 'this resource'}
        submitting={quickSubmitting}
        error={quickError}
        thanked={quickThanks}
        onSubmit={handleQuickRatingSubmit}
        onClose={closeQuickRating}
      />

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submittingReview && setShowReviewModal(false)}>
          <div
            className="bg-[#FFFDF8] rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact gradient header */}
            <div className="relative bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] px-6 pt-5 pb-6 text-center">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setEditingReviewId(null);
                  setUserRating(0);
                  setReviewComment('');
                  setReviewModalError(null);
                  setHoverRating(0);
                }}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="font-hand text-2xl text-white">
                {editingReviewId ? 'Update your review' : 'Share your experience'}
              </p>
              <p className="mt-0.5 text-xs font-medium text-white/85">rate it and add a comment if you like ♡</p>
            </div>

            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              {reviewModalError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                  {reviewModalError}
                </div>
              )}

              {/* Stars — hover preview like the quick popup */}
              <div
                className="flex items-center justify-center gap-2"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[...Array(5)].map((_, i) => {
                  const value = i + 1;
                  const active = value <= (hoverRating || userRating);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={submittingReview}
                      onMouseEnter={() => setHoverRating(value)}
                      onClick={() => setUserRating(value)}
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                      className="transition-transform hover:scale-125 active:scale-110"
                    >
                      <Star
                        className={`h-9 w-9 transition-colors ${
                          active ? 'fill-[#D9A93F] text-[#D9A93F]' : 'text-[#D8CFC0]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Comment textarea — always visible, optional */}
              <div className="mt-4">
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value.slice(0, 200))}
                  placeholder="Tell other students what you liked… (optional)"
                  maxLength={200}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#A29785] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
                <div className="mt-1 text-right text-[11px] text-[#A29785]">
                  {reviewComment.length}/200
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 space-y-2">
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || userRating === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{editingReviewId ? 'Update Review' : 'Post Review'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setEditingReviewId(null);
                    setUserRating(0);
                    setReviewComment('');
                    setReviewModalError(null);
                    setHoverRating(0);
                  }}
                  disabled={submittingReview}
                  className="mx-auto block text-xs font-medium text-[#A29785] transition-colors hover:text-[#6B6257]"
                >
                  Cancel
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
