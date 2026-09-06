import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getFailedCaptures, getPendingCaptures, capturePayment } from '@/lib/paymentCapture';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'failed';
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    let orders;
    if (type === 'failed') {
      orders = await getFailedCaptures(limit);
    } else if (type === 'pending') {
      orders = await getPendingCaptures(limit);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching payment captures:', error);
    return NextResponse.json({ error: 'Failed to fetch payment captures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { orderId, action } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await connectDB();

    if (action === 'retry') {
      console.log('🔄 Admin requesting retry for order:', orderId);
      const result = await capturePayment(orderId);
      return NextResponse.json({ success: result.success, error: result.error });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing payment capture action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
