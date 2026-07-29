'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageSkeleton from '@/components/ui/PageSkeleton';

interface CartItem {
  _id: string;
  resourceId: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    price: number;
    discount?: number;
    category: string;
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCart(data.cart || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch cart');
      }
    } catch (err) {
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/cart?resourceId=${resourceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCart(cart.filter((item) => item.resourceId._id !== resourceId));
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const handleResourceClick = (resourceId: string) => {
    router.push(`/resource/${resourceId}`);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.resourceId.discount && item.resourceId.discount > 0
        ? item.resourceId.price * (1 - item.resourceId.discount / 100)
        : item.resourceId.price;
      return total + price;
    }, 0);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not apply coupon.');
      setCouponCode(data.coupon.code);
      setCouponDiscount(data.coupon.discountPercentage);
      setCouponMessage(`${data.coupon.discountPercentage}% off applied`);
    } catch (err) {
      setCouponDiscount(null);
      setCouponMessage(err instanceof Error ? err.message : 'Could not apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = calculateTotal();
  const couponAmount = couponDiscount ? subtotal * (couponDiscount / 100) : 0;
  const totalAfterCoupon = subtotal - couponAmount;

  if (loading) {
    return <PageSkeleton showSidebar cards={3} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            My Cart
          </h1>
          <p className="text-gray-600">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Start adding resources to your cart!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
                >
                  <div className="h-24 w-24 bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.resourceId.thumbnailUrl}
                      alt={item.resourceId.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {item.resourceId.title}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {item.resourceId.category}
                    </span>
                  </div>
                  <div className="text-right">
                    {item.resourceId.discount && item.resourceId.discount > 0 ? (
                      <div>
                        <span className="text-sm text-gray-500 line-through">₹{item.resourceId.price}</span>
                        <span className="text-lg font-bold text-green-600 ml-2">
                          ₹{(item.resourceId.price * (1 - item.resourceId.discount / 100)).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">₹{item.resourceId.price}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleResourceClick(item.resourceId._id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => removeFromCart(item.resourceId._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <label htmlFor="cart-coupon" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#475569]">Coupon code</label>
                  <div className="flex gap-2">
                    <input id="cart-coupon" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponDiscount(null); setCouponMessage(null); }} placeholder="Enter code" className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-blue-500" />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">{couponLoading ? '...' : 'Apply'}</button>
                  </div>
                  {couponMessage && <p className={`mt-2 text-xs font-medium ${couponDiscount ? 'text-green-700' : 'text-red-600'}`}>{couponMessage}</p>}
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span className="text-green-600">−₹{couponAmount.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{totalAfterCoupon.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() => router.push('/checkout')}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
