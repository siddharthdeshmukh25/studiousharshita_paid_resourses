'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CheckoutSkeleton from '@/components/ui/CheckoutSkeleton';
import {
  Lock,
  Shield,
  Zap,
  RefreshCw,
  LifeBuoy,
  Loader2,
  IndianRupee,
  Tag,
  BadgeCheck,
  Store,
} from 'lucide-react';

interface Resource {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  thumbnailUrl?: string;
  category: string;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_self' }) => Promise<unknown>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

function CheckoutPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const resourceAmount =
    resource && resource.discount && resource.discount > 0
      ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
      : resource?.price ?? 0;
  const finalAmount = couponDiscount
    ? Number((resourceAmount * (1 - couponDiscount / 100)).toFixed(2))
    : resourceAmount;
  const originalAmount = resource?.price ?? 0;

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await fetch(`/api/resources/${params.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load resource');
        setResource(data.resource);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchResource();
  }, [params.id]);

  const validateCoupon = async (code?: string) => {
    const effectiveCode = (code ?? couponCode).trim().toUpperCase();
    if (!effectiveCode || !resource) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: effectiveCode, purchaseAmount: resourceAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not apply coupon.');

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

  // Auto-apply a coupon passed from the resource page (?coupon=CODE)
  useEffect(() => {
    const fromQuery = searchParams.get('coupon');
    if (fromQuery && resource && couponDiscount === null && couponMessage === null) {
      const timer = setTimeout(() => {
        setCouponCode(fromQuery);
        validateCoupon(fromQuery);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, resource]);

  const handleCheckout = async () => {
    if (!session) {
      await signIn('google', { callbackUrl: `/checkout/${params.id}` });
      return;
    }

    const sessionExpiry = session.expires;
    if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
      await signOut({ callbackUrl: '/' });
      return;
    }

    setCheckoutLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: params.id, couponCode: couponDiscount ? couponCode : undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Payment gateway is not configured.' || data.error === 'Payment gateway not supported yet.') {
          throw new Error('Payment service is not available at this time. Please contact admin or try again later.');
        }
        if (response.status === 401) {
          await signOut({ callbackUrl: '/' });
          throw new Error('Your session has expired. Please login again.');
        }
        throw new Error(data.error || 'Failed to create order');
      }

      if (data.gateway === 'razorpay') {
        if (!window.Razorpay) {
          throw new Error('Razorpay checkout is still loading. Please try again in a moment.');
        }
        const options = {
          key: data.keyId,
          amount: data.amount * 100,
          currency: 'INR',
          name: 'studiousharshita',
          description: resource?.title,
          order_id: data.paymentSessionId,
          handler: function (paymentResponse: { razorpay_payment_id?: string }) {
            const returnUrl = `/payment/return?order_id=${data.orderId}`;
            window.location.href = data.razorpayOrderId
              ? `${returnUrl}&razorpay_order_id=${data.razorpayOrderId}&payment_id=${paymentResponse.razorpay_payment_id}`
              : returnUrl;
          },
          modal: {
            ondismiss: function () {
              setCheckoutLoading(false);
              setPaymentError('Payment cancelled. You can try again when ready.');
            },
            onclose: function () {
              setCheckoutLoading(false);
            },
          },
          prefill: {
            name: session.user?.name,
            email: session.user?.email,
          },
          theme: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563EB',
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
      setPaymentError(errorMessage);
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <CheckoutSkeleton />;
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource not found</h2>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-[var(--accent)] hover:text-[var(--accent-text)] font-medium"
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

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Secure Checkout</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900">Review your order</h1>
            <p className="mt-1 text-base text-gray-600">
              Please confirm the details below before completing your purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            {/* Left: order details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Resource summary */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    Item details
                  </h2>
                </div>
                <div className="p-6 flex gap-5">
                  <div className="h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                    <img
                      src={resource.thumbnailUrl || '/placeholder.png'}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {resource.category}
                    </span>
                    <h3 className="mt-2 text-lg md:text-xl font-semibold text-gray-900 leading-snug">
                      {resource.title}
                    </h3>
                    <p className="mt-1 text-base text-gray-600">
                      Digital resource · Instant access after payment
                    </p>
                  </div>
                </div>
              </section>

              {/* Coupon */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-blue-600" />
                  Have a coupon?
                </h2>
                <div className="flex gap-3">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponDiscount(null);
                      setCouponMessage(null);
                    }}
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-semibold uppercase text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => validateCoupon()}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg bg-gray-900 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {couponMessage && (
                  <p className={`mt-3 text-base ${couponDiscount ? 'text-blue-700' : 'text-red-600'}`}>
                    {couponMessage}
                  </p>
                )}
                {couponDiscount && (
                  <p className="mt-2 text-base font-semibold text-blue-700">
                    You pay ₹{finalAmount.toFixed(2)} after {couponDiscount}% off.
                  </p>
                )}
              </section>

              {/* Payment method note */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Payment method
                </h2>
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white flex-shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Secure online payment</p>
                    <p className="text-sm text-gray-600">
                      UPI, cards, net banking & wallets — processed by our payment partner.
                    </p>
                  </div>
                </div>

                {paymentError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <p className="font-semibold mb-1">Payment Notice</p>
                    <p className="text-red-600">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="mt-6 w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-3 transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>Pay ₹{finalAmount.toFixed(2)} securely</span>
                    </>
                  )}
                </button>

                <p className="mt-4 text-sm text-gray-500 text-center leading-relaxed">
                  By completing this purchase you agree to our{' '}
                  <a href="/terms-of-service" className="text-[var(--accent)] hover:underline">Terms of Service</a> and{' '}
                  <a href="/refund-policy" className="text-[var(--accent)] hover:underline">Refund Policy</a>.
                </p>
              </section>
            </div>

            {/* Right: price summary + trust */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Price summary</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-gray-600">Original price</span>
                    <span className="font-medium text-gray-900">₹{originalAmount.toFixed(2)}</span>
                  </div>
                  {resource.discount && resource.discount > 0 && (
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600">Item discount</span>
                      <span className="font-semibold text-red-600">−{Math.round(resource.discount)}%</span>
                    </div>
                  )}
                  {couponDiscount && (
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600">Coupon ({couponCode})</span>
                      <span className="font-semibold text-red-600">−{couponDiscount}%</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total payable</span>
                    <span className="text-2xl font-bold text-gray-900">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Trust badges */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-blue-600" />
                  Why buy with us
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base font-medium text-gray-900">Secure payments</p>
                      <p className="text-sm text-gray-600">256-bit encrypted transactions via trusted gateways.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base font-medium text-gray-900">Instant access</p>
                      <p className="text-sm text-gray-600">Your resource unlocks in your dashboard right after payment.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base font-medium text-gray-900">Refund policy</p>
                      <p className="text-sm text-gray-600">Clear, fair refund terms for digital products.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LifeBuoy className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base font-medium text-gray-900">24×7 support</p>
                      <p className="text-sm text-gray-600">Raise a support ticket any time — we reply within 24-48 hours.</p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* Business info */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business information</h2>
                <dl className="space-y-3 text-base">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Legal entity</dt>
                    <dd className="font-medium text-gray-900 text-right">Harshita Pravinbhai Soni</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Business type</dt>
                    <dd className="font-medium text-gray-900 text-right">Educational digital resources</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Support</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      <a href="mailto:support@studiousharshita.com" className="text-[var(--accent)] hover:underline">
                        support@studiousharshita.com
                      </a>
                    </dd>
                  </div>
                </dl>
              </section>

              <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                <IndianRupee className="h-4 w-4" />
                Prices shown in INR (₹). Taxes included where applicable.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageContent />
    </Suspense>
  );
}