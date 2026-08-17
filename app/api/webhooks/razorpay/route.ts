import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Resource from '@/models/Resource';
import PaymentSettings from '@/models/PaymentSettings';
import { capturePayment } from '@/lib/paymentCapture';

function verifyRazorpayWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const settings = await PaymentSettings.findOne();
    
    // Skip signature verification if webhook secret is not configured (for development)
    if (settings?.razorpay?.webhookSecret) {
      const isValid = verifyRazorpayWebhookSignature(body, signature, settings.razorpay.webhookSecret);
      if (!isValid) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Razorpay webhook secret not configured - skipping signature verification (development mode)');
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    await connectDB();

    if (event.event === 'payment.authorized') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const notes = payment.notes;

      // Create order only when payment is authorized
      const userId = notes?.userId;
      const resourceId = notes?.resourceId;

      if (!userId || !resourceId) {
        console.error('Missing userId or resourceId in payment notes:', notes);
        return NextResponse.json({ error: 'Missing order information' }, { status: 400 });
      }

      // Check if order already exists
      let order = await Order.findOne({ cashfreeOrderId: orderId });
      
      if (!order) {
        // Create new order since payment was authorized
        order = await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: orderId,
          cashfreePaymentId: paymentId,
          amount: payment.amount / 100, // Convert from paise to rupees
          status: 'pending',
          gateway: 'razorpay',
          captureStatus: 'pending',
          paymentCaptured: false,
        });
        console.log('Created new order for authorized payment:', orderId);
      } else {
        // Update existing order with payment ID
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { 
            cashfreePaymentId: paymentId,
            captureStatus: 'pending',
          }
        );
      }

      // Attempt auto-capture
      console.log('Attempting auto-capture for payment:', paymentId);
      const captureResult = await capturePayment(orderId);
      console.log('Auto-capture result:', captureResult);

      if (captureResult.success) {
        // Grant access to user
        const user = await User.findById(userId);
        const resource = await Resource.findById(resourceId);
        
        if (user && resource) {
          if (!user.purchasedResources.includes(resource._id)) {
            user.purchasedResources.push(resource._id);
            await user.save();
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const notes = payment.notes;

      const order = await Order.findOne({ cashfreeOrderId: orderId });
      
      if (!order && notes?.userId && notes?.resourceId) {
        // Create order if it doesn't exist
        await Order.create({
          userId: notes.userId,
          resourceId: notes.resourceId,
          cashfreeOrderId: orderId,
          cashfreePaymentId: payment.id,
          amount: payment.amount / 100,
          status: 'completed',
          gateway: 'razorpay',
          captureStatus: 'success',
          paymentCaptured: true,
        });
        
        // Grant access to user
        const user = await User.findById(notes.userId);
        const resource = await Resource.findById(notes.resourceId);
        
        if (user && resource) {
          if (!user.purchasedResources.includes(resource._id)) {
            user.purchasedResources.push(resource._id);
            await user.save();
          }
        }
      } else if (order) {
        // Update existing order as completed
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { 
            paymentCaptured: true,
            captureStatus: 'success',
            status: 'completed',
          }
        );

        // Grant access to user
        const user = await User.findById(order.userId);
        const resource = await Resource.findById(order.resourceId);
        
        if (user && resource) {
          if (!user.purchasedResources.includes(resource._id)) {
            user.purchasedResources.push(resource._id);
            await user.save();
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const notes = payment.notes;

      const order = await Order.findOne({ cashfreeOrderId: orderId });
      
      if (!order && notes?.userId && notes?.resourceId) {
        // Create failed order record
        await Order.create({
          userId: notes.userId,
          resourceId: notes.resourceId,
          cashfreeOrderId: orderId,
          cashfreePaymentId: payment.id,
          amount: payment.amount / 100,
          status: 'failed',
          gateway: 'razorpay',
          captureStatus: 'failed',
          paymentCaptured: false,
          captureFailureReason: payment.error_description || 'Payment failed',
        });
        console.log('Created failed order for:', orderId);
      } else if (order) {
        // Update existing order as failed
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { 
            paymentCaptured: false,
            captureStatus: 'failed',
            captureFailureReason: payment.error_description || 'Payment failed',
            status: 'failed',
          }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
