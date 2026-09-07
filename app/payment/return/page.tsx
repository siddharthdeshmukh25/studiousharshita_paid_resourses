'use client';

import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Loader2, Receipt, Clock, Shield, Copy, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

type PaymentState = 'verifying' | 'success' | 'error';

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<PaymentState>('verifying');
  const [message, setMessage] = useState('Confirming your payment securely.');
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    razorpayOrderId?: string;
    paymentId?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get('order_id');
      const razorpayOrderId = searchParams.get('razorpay_order_id');
      if (!orderId) { setState('error'); setMessage('We could not identify this payment order.'); return; }

      console.log('Payment return for order:', orderId, 'Razorpay order ID:', razorpayOrderId);

      // Store order details for display
      setOrderDetails({
        orderId,
        razorpayOrderId: razorpayOrderId || undefined,
      });

      try {
        // Verify payment status - pass both order IDs if available
        const response = await fetch('/api/checkout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, razorpayOrderId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setState('success');
          setMessage('Payment successful! Your resource is now available in your dashboard.');
          // Add payment ID if available from response
          if (data.paymentId) {
            setOrderDetails(prev => prev ? { ...prev, paymentId: data.paymentId } : prev);
          }
        } else if (response.status === 202) {
          // Payment still processing
          setState('success');
          setMessage('Payment is being processed. Your resource will be available in your dashboard shortly.');
        } else {
          setState('error');
          setMessage(data.error || 'Payment verification failed. Please contact support.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setState('error');
        setMessage('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--accent-soft)] via-white to-[var(--accent-soft-2)]">
    <Navbar />
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className={`bg-gradient-to-r px-8 py-6 ${state === 'success' ? 'from-[var(--accent)] to-[var(--accent-deep)]' :
              state === 'error' ? 'from-red-500 to-rose-600' :
                'from-[var(--accent)] to-[var(--accent-deep)]'
            }`}>
            <div className="flex items-center justify-center">
              {state === 'verifying' && (
                <div className="bg-white/20 rounded-full p-4">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              )}
              {state === 'success' && (
                <div className="bg-white/20 rounded-full p-4">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              )}
              {state === 'error' && (
                <div className="bg-white/20 rounded-full p-4">
                  <CircleAlert className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white text-center">
              {state === 'verifying' ? 'Verifying Payment' :
                state === 'success' ? 'Payment Successful!' :
                  'Payment Needs Attention'}
            </h1>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <p className="text-center text-gray-600 text-sm leading-relaxed mb-6">
              {message}
            </p>

            {/* Order Details Card */}
            {state !== 'verifying' && orderDetails && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Order Details
                </h3>

                <div className="space-y-3">
                  {/* Custom Order ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Order ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                        {orderDetails.orderId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(orderDetails.orderId)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Order ID"
                      >
                        {copied ? <Check className="h-3 w-3 text-[var(--accent)]" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Razorpay Order ID */}
                  {orderDetails.razorpayOrderId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Razorpay Order ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                          {orderDetails.razorpayOrderId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(orderDetails.razorpayOrderId!)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Razorpay Order ID"
                        >
                          {copied ? <Check className="h-3 w-3 text-[var(--accent)]" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment ID */}
                  {orderDetails.paymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Payment ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                          {orderDetails.paymentId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(orderDetails.paymentId!)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy Payment ID"
                        >
                          {copied ? <Check className="h-3 w-3 text-[var(--accent)]" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Pills */}
            {state === 'success' && (
              <div className="flex gap-2 mb-6">
                <div className="flex-1 bg-[var(--accent-soft)] rounded-lg p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-[var(--accent-text)]">Secure Payment</span>
                </div>
                <div className="flex-1 bg-indigo-50 rounded-lg p-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs text-indigo-700">Instant Access</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            {state !== 'verifying' && (
              <button
                onClick={() => router.push(state === 'success' ? '/dashboard' : '/')}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${state === 'success'
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] hover:from-[var(--accent-deep)] hover:to-[var(--accent-deep)]'
                    : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] hover:from-blue-600 hover:to-indigo-700'
                  }`}
              >
                {state === 'success' ? 'Go to Dashboard' : 'Return Home'}
              </button>
            )}

            {/* Secondary Info */}
            {state === 'success' && (
              <p className="text-center text-xs text-gray-400 mt-4">
                A confirmation email has been sent to your registered email address.
              </p>
            )}

            {/* Social Media Follow Section */}
            {state === 'success' && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-sm font-semibold text-gray-700 mb-4">Follow us for more resources</p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://beacons.ai/studiousharshita/mediakit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Visit Beacons"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 80.4 77" fill="currentColor">
                      <path d="M29.2,37.7c10.4,0,18.8-8.4,18.8-18.9C48.1,8.4,39.6,0,29.2,0C18.8,0,10.4,8.4,10.4,18.9C10.4,29.3,18.8,37.7,29.2,37.7z" />
                      <path d="M63.1,25.7c5.2,0,9.5-4.2,9.5-9.5c0-5.2-4.2-9.5-9.5-9.5c-5.2,0-9.5,4.2-9.5,9.5C53.6,21.5,57.9,25.7,63.1,25.7z" />
                      <path d="M9.5,53.7c5.2,0,9.5-4.2,9.5-9.5c0-5.2-4.2-9.5-9.5-9.5C4.2,34.7,0,39,0,44.2C0,49.4,4.2,53.7,9.5,53.7z" />
                      <path d="M60.7,70.2c10.9,0,19.7-8.8,19.7-19.7s-8.8-19.7-19.7-19.7c-10.9,0-19.7,8.8-19.7,19.7S49.9,70.2,60.7,70.2z" />
                      <path d="M27.1,77C33.7,77,39,71.7,39,65.2s-5.3-11.8-11.8-11.8c-6.5,0-11.8,5.3-11.8,11.8S20.6,77,27.1,77z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/studious_harshita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                    title="Follow on Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919,1.266-.057,1.645-.069,4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com/@studious_harshita?si=Z2hL8a4xx_nsgkCQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                    title="Subscribe on YouTube"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Info */}
        {state === 'error' && (
          <div className="mt-4 space-y-3 text-center">
            <button
              onClick={() => router.push(`/support?orderId=${encodeURIComponent(orderDetails?.orderId || '')}`)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-[var(--accent-deep)] transition-colors"
            >
              Raise a Support Ticket
            </button>
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@studiousharshita.com" className="text-[var(--accent)] hover:underline">
                support@studiousharshita.com
              </a>
            </p>
          </div>
        )}
      </section>
    </main>
    <Footer />
  </div>;
}

export default function PaymentReturnPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[var(--accent-soft)] via-white to-[var(--accent-soft-2)]" />}><PaymentReturnContent /></Suspense>;
}
