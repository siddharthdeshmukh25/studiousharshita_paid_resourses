import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import { getValidCoupon } from '@/lib/coupons';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const apiVersion = process.env.CASHFREE_API_VERSION || '2025-01-01';

function cashfreeBaseUrl() {
  return process.env.CASHFREE_ENVIRONMENT === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function cashfreeHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-version': apiVersion,
    'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
  };
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return User.findOne({ email: session.user.email });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Cashfree credentials are not configured.' }, { status: 500 });
    }

    const body = await request.json() as { resourceId?: string; couponCode?: string };
    const customerPhone = process.env.CASHFREE_DEFAULT_CUSTOMER_PHONE?.replace(/\D/g, '');
    if (!body.resourceId) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }
    if (!customerPhone || customerPhone.length !== 10) {
      return NextResponse.json({ error: 'Cashfree customer phone is not configured.' }, { status: 500 });
    }

    await connectDB();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });

    const resource = await Resource.findById(body.resourceId);
    if (!resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    if (user.purchasedResources.some((item) => item.toString() === resource._id.toString())) {
      return NextResponse.json({ error: 'You have already purchased this resource.' }, { status: 400 });
    }

    const resourceAmount = resource.discount && resource.discount > 0
      ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
      : resource.price;
    const coupon = body.couponCode ? await getValidCoupon(body.couponCode) : null;
    if (body.couponCode && !coupon) {
      return NextResponse.json({ error: 'This coupon is invalid or has expired.' }, { status: 400 });
    }
    const amount = coupon
      ? Number((resourceAmount * (1 - coupon.discountPercentage / 100)).toFixed(2))
      : resourceAmount;
    const orderId = `cf_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const returnUrl = `${request.nextUrl.origin}/payment/return?order_id={order_id}`;

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl()}/orders`, {
      method: 'POST',
      headers: { ...cashfreeHeaders(), 'x-idempotency-key': randomUUID() },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: user._id.toString(),
          customer_name: user.name,
          customer_email: user.email,
          customer_phone: customerPhone,
        },
        order_meta: { return_url: returnUrl },
        order_note: `Purchase: ${resource.title}`,
      }),
    });
    const cashfreeOrder = await cashfreeResponse.json() as { payment_session_id?: string; message?: string };
    if (!cashfreeResponse.ok || !cashfreeOrder.payment_session_id) {
      console.error('Cashfree order creation failed:', cashfreeOrder);
      return NextResponse.json({ error: cashfreeOrder.message || 'Cashfree could not create the payment order.' }, { status: 502 });
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
    return NextResponse.json({
      paymentSessionId: cashfreeOrder.payment_session_id,
      environment: process.env.CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });
  } catch (error) {
    console.error('Cashfree checkout error:', error);
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

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(order.cashfreeOrderId)}`, {
      headers: cashfreeHeaders(),
      cache: 'no-store',
    });
    const cashfreeOrder = await cashfreeResponse.json() as { order_status?: string; cf_order_id?: string; message?: string };
    if (!cashfreeResponse.ok) return NextResponse.json({ error: cashfreeOrder.message || 'Could not verify payment status.' }, { status: 502 });
    if (cashfreeOrder.order_status !== 'PAID') return NextResponse.json({ error: 'Payment was not completed.' }, { status: 400 });

    order.status = 'completed';
    order.cashfreePaymentId = cashfreeOrder.cf_order_id;
    await order.save();
    await User.findByIdAndUpdate(user._id, { $addToSet: { purchasedResources: order.resourceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify the payment.' }, { status: 500 });
  }
}
