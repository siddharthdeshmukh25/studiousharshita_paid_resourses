import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import { shouldRetryCapture, capturePayment } from '@/lib/paymentCapture';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    console.log('🔄 Starting batch retry for Razorpay orders');

    // Get all Razorpay orders that need retry
    const orders = await Order.find({
      paymentCaptured: false,
      status: { $ne: 'failed' },
      razorpayOrderId: { $exists: true, $ne: null } // Only Razorpay orders
    }).sort({ createdAt: -1 });

    console.log(`📋 Found ${orders.length} Razorpay orders for retry`);

    const results = {
      total: orders.length,
      retried: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const order of orders) {
      const shouldRetry = await shouldRetryCapture(order);
      
      if (!shouldRetry) {
        results.skipped++;
        results.details.push({
          orderId: order.cashfreeOrderId,
          razorpayOrderId: order.razorpayOrderId,
          status: 'skipped',
          reason: 'Not eligible for retry',
        });
        continue;
      }

      results.retried++;
      console.log(`🔄 Retrying order: ${order.cashfreeOrderId} (Razorpay: ${order.razorpayOrderId})`);
      const result = await capturePayment(order.cashfreeOrderId);
      
      if (result.success) {
        results.successful++;
        results.details.push({
          orderId: order.cashfreeOrderId,
          razorpayOrderId: order.razorpayOrderId,
          status: 'success',
        });
        console.log(`✅ Successfully captured: ${order.cashfreeOrderId}`);
      } else {
        results.failed++;
        results.details.push({
          orderId: order.cashfreeOrderId,
          razorpayOrderId: order.razorpayOrderId,
          status: 'failed',
          error: result.error,
        });
        console.log(`❌ Failed to capture: ${order.cashfreeOrderId} - ${result.error}`);
      }
    }

    console.log(`📊 Batch retry results:`, results);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('❌ Error in batch retry:', error);
    return NextResponse.json({ error: 'Batch retry failed' }, { status: 500 });
  }
}
