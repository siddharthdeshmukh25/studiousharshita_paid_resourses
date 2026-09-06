import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Resource from '@/models/Resource';
import PaymentSettings from '@/models/PaymentSettings';
import { capturePayment } from '@/lib/paymentCapture';

function verifyCashfreeWebhookSignature(payload: string, signature: string, timestamp: string, secret: string): boolean {
  // Cashfree signs `<timestamp><rawBody>` with the API client secret and sends
  // the result base64-encoded in the x-webhook-signature header.
  const signedPayload = timestamp + payload;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.error('Missing Cashfree webhook signature or timestamp');
      return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 400 });
    }

    const settings = await PaymentSettings.findOne();

    // Fail closed: never process an unverifiable webhook. Cashfree signs with
    // the client secret; webhookSecret is kept as a fallback for older setups.
    const secret = settings?.cashfree?.clientSecret || settings?.cashfree?.webhookSecret;
    if (!secret) {
      console.error('Cashfree webhook secret not configured - refusing unverifiable webhook');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const isValid = verifyCashfreeWebhookSignature(body, signature, timestamp, secret);
    if (!isValid) {
      console.error('Invalid Cashfree webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Cashfree webhook event:', event.type);

    await connectDB();

    if (event.type === 'PAYMENT_SUCCESS' || event.type === 'ORDER_SUCCESS') {
      const data = event.data;
      const orderId = data.order_id;
      const paymentId = data.payment?.cf_payment_id || data.payment_id;
      const orderTags = data.order_tags || {};
      const userId = orderTags.userId;
      const resourceId = orderTags.resourceId;

      if (!userId || !resourceId) {
        console.error('Missing userId or resourceId in order tags:', orderTags);
        return NextResponse.json({ error: 'Missing order information' }, { status: 400 });
      }

      // Check if order already exists
      let order = await Order.findOne({ cashfreeOrderId: orderId });
      
      if (!order) {
        // Create new order since payment was successful
        order = await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: orderId,
          cashfreePaymentId: paymentId,
          amount: data.order_amount,
          status: 'completed',
          gateway: 'cashfree',
          captureStatus: 'success',
          paymentCaptured: true,
        });
        console.log('Created new order for successful payment:', orderId);
      } else {
        // Update existing order with payment ID
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { 
            cashfreePaymentId: paymentId,
            paymentCaptured: true,
            captureStatus: 'success',
            status: 'completed',
          }
        );
      }

      // Grant access to user
      const user = await User.findById(userId);
      const resource = await Resource.findById(resourceId);
      
      if (user && resource) {
        if (!user.purchasedResources.includes(resource._id)) {
          user.purchasedResources.push(resource._id);
          await user.save();
        }
      }

      return NextResponse.json({ success: true });
    }

    if (event.type === 'PAYMENT_FAILED' || event.type === 'ORDER_FAILED') {
      const data = event.data;
      const orderId = data.order_id;
      const orderTags = data.order_tags || {};
      const userId = orderTags.userId;
      const resourceId = orderTags.resourceId;

      // Check if order already exists
      let order = await Order.findOne({ cashfreeOrderId: orderId });
      
      if (!order && userId && resourceId) {
        // Create failed order record
        order = await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: orderId,
          amount: data.order_amount,
          status: 'failed',
          gateway: 'cashfree',
          captureStatus: 'failed',
          paymentCaptured: false,
          captureFailureReason: data.payment?.error_message || 'Payment failed',
        });
        console.log('Created failed order for:', orderId);
      } else if (order) {
        // Update existing order as failed
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { 
            paymentCaptured: false,
            captureStatus: 'failed',
            captureFailureReason: data.payment?.error_message || 'Payment failed',
            status: 'failed',
          }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (event.type === 'PAYMENT_PENDING') {
      const data = event.data;
      const orderId = data.order_id;

      const order = await Order.findOne({ cashfreeOrderId: orderId });
      if (!order) {
        console.error('Order not found for pending Cashfree payment:', orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Payment is pending, try to capture
      console.log('Payment pending, attempting capture for order:', orderId);
      const captureResult = await capturePayment(orderId);
      console.log('Capture result for pending payment:', captureResult);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
