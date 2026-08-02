import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import PaymentSettings from '@/models/PaymentSettings';
import { getValidCoupon } from '@/lib/coupons';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

async function getPaymentSettings() {
  await connectDB();
  const settings = await PaymentSettings.findOne();
  return settings;
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return User.findById(session.user.id);
}

// Razorpay functions
function razorpayBaseUrl() {
  return 'https://api.razorpay.com/v1';
}

function razorpayHeaders(settings: any) {
  const razorpayConfig = settings?.razorpay || {};
  const keyId = razorpayConfig.keyId;
  const keySecret = razorpayConfig.keySecret;

  console.log('Razorpay config:', { keyId: keyId ? '***' : 'missing', keySecret: keySecret ? '***' : 'missing' });

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
  };
}

// Cashfree functions
function cashfreeBaseUrl() {
  return 'https://api.cashfree.com/pg';
}

function cashfreeHeaders(settings: any) {
  const cashfreeConfig = settings?.cashfree || {};
  const clientId = cashfreeConfig.clientId;
  const clientSecret = cashfreeConfig.clientSecret;

  console.log('Cashfree config:', { clientId: clientId ? '***' : 'missing', clientSecret: clientSecret ? '***' : 'missing' });

  return {
    'Content-Type': 'application/json',
    'x-api-version': '2025-01-01',
    'x-client-id': clientId || '',
    'x-client-secret': clientSecret || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const settings = await getPaymentSettings();
    if (!settings || !settings.gateway) {
      console.error('Payment settings not configured:', settings);
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const body = await request.json() as { resourceId?: string; couponCode?: string };
    console.log('Checkout request body:', body);
    if (!body.resourceId) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    await connectDB();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });

    console.log('Looking for resource with ID:', body.resourceId);
    const resource = await Resource.findById(body.resourceId);
    console.log('Found resource:', resource);
    if (!resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    if (user.purchasedResources.some((item) => item.toString() === resource._id.toString())) {
      return NextResponse.json({ error: 'You have already purchased this resource.' }, { status: 400 });
    }

    const resourceAmount = resource.discount && resource.discount > 0
      ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
      : resource.price;
    const coupon = body.couponCode ? await getValidCoupon(body.couponCode, resourceAmount) : null;
    if (body.couponCode && !coupon) {
      return NextResponse.json({ error: 'This coupon is invalid, expired, or does not meet the minimum purchase requirement.' }, { status: 400 });
    }
    const amount = coupon
      ? Number((resourceAmount * (1 - coupon.discountPercentage / 100)).toFixed(2))
      : resourceAmount;

    // Ensure minimum price of ₹1 for payment gateway compatibility
    const MINIMUM_PRICE = 1;
    if (amount < MINIMUM_PRICE) {
      return NextResponse.json({ 
        error: `Final price cannot be less than ₹${MINIMUM_PRICE}. Please use a smaller discount or increase the resource price.` 
      }, { status: 400 });
    }

    const orderId = `${settings.gateway}_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const returnUrl = `${request.nextUrl.origin}/payment/return?order_id={order_id}`;

    let paymentResponse;
    let paymentSessionId;

    if (settings.gateway === 'razorpay') {
      // Razorpay checkout
      const razorpayResponse = await fetch(`${razorpayBaseUrl()}/orders`, {
        method: 'POST',
        headers: razorpayHeaders(settings),
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: orderId,
          notes: {
            userId: user._id.toString(),
            resourceId: resource._id.toString(),
            resourceTitle: resource.title,
          },
        }),
      });
      paymentResponse = await razorpayResponse.json();
      if (!razorpayResponse.ok || !paymentResponse.id) {
        console.error('Razorpay order creation failed:', paymentResponse);
        return NextResponse.json({ error: paymentResponse.error?.description || 'Razorpay could not create the payment order.' }, { status: 502 });
      }
      paymentSessionId = paymentResponse.id;
    } else if (settings.gateway === 'cashfree') {
      // Cashfree checkout
      const cashfreeResponse = await fetch(`${cashfreeBaseUrl()}/orders`, {
        method: 'POST',
        headers: { ...cashfreeHeaders(settings), 'x-idempotency-key': randomUUID() },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: user._id.toString(),
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: '9999999999', // Default phone - in production, collect from user during signup
          },
          order_meta: { return_url: returnUrl },
          order_note: `Purchase: ${resource.title}`,
        }),
      });
      paymentResponse = await cashfreeResponse.json();
      if (!cashfreeResponse.ok || !paymentResponse.payment_session_id) {
        console.error('Cashfree order creation failed:', paymentResponse);
        return NextResponse.json({ error: paymentResponse.message || 'Cashfree could not create the payment order.' }, { status: 502 });
      }
      paymentSessionId = paymentResponse.payment_session_id;
    } else {
      return NextResponse.json({ error: 'Payment gateway not supported yet.' }, { status: 400 });
    }

    await Order.create({
      userId: user._id,
      resourceId: resource._id,
      cashfreeOrderId: orderId,
      amount,
      couponCode: coupon?.code,
      couponDiscountPercentage: coupon?.discountPercentage,
      status: 'pending',
    });

    const responseData: any = {
      paymentSessionId,
      gateway: settings.gateway,
      environment: 'production',
      orderId,
      amount,
    };

    // Add keyId for Razorpay frontend initialization
    if (settings.gateway === 'razorpay') {
      responseData.keyId = settings.razorpay.keyId;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create the payment order.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { orderId?: string };
    if (!body.orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });

    await connectDB();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });

    const order = await Order.findOne({ cashfreeOrderId: body.orderId, userId: user._id });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status === 'completed') return NextResponse.json({ success: true });

    const settings = await getPaymentSettings();
    let paymentStatus = false;

    if (settings.gateway === 'razorpay') {
      // Razorpay verification (simplified - in production you'd use webhook)
      const razorpayResponse = await fetch(`${razorpayBaseUrl()}/orders/${order.cashfreeOrderId}`, {
        headers: razorpayHeaders(settings),
        cache: 'no-store',
      });
      const razorpayOrder = await razorpayResponse.json();
      if (razorpayResponse.ok && razorpayOrder.status === 'paid') {
        paymentStatus = true;
      }
    } else if (settings.gateway === 'cashfree') {
      // Cashfree verification
      const cashfreeResponse = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(order.cashfreeOrderId)}`, {
        headers: cashfreeHeaders(settings),
        cache: 'no-store',
      });
      const cashfreeOrder = await cashfreeResponse.json();
      if (cashfreeResponse.ok && cashfreeOrder.order_status === 'PAID') {
        paymentStatus = true;
      }
    }

    if (!paymentStatus) {
      return NextResponse.json({ error: 'Payment was not completed.' }, { status: 400 });
    }

    order.status = 'completed';
    await order.save();
    await User.findByIdAndUpdate(user._id, { $addToSet: { purchasedResources: order.resourceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify the payment.' }, { status: 500 });
  }
}
