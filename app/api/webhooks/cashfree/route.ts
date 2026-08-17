import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Resource from '@/models/Resource';
import PaymentSettings from '@/models/PaymentSettings';
import { capturePayment } from '@/lib/paymentCapture';

function verifyCashfreeWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    if (!signature) {
      console.error('Missing Cashfree webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const settings = await PaymentSettings.findOne();
    
    // Skip signature verification if webhook secret is not configured (for development)
    if (settings?.cashfree?.webhookSecret) {
      const isValid = verifyCashfreeWebhookSignature(body, signature, settings.cashfree.webhookSecret);
      if (!isValid) {
        console.error('Invalid Cashfree webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Cashfree webhook secret not configured - skipping signature verification (development mode)');
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
