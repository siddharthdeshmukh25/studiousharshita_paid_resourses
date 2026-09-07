import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('resourceId', 'title thumbnailUrl price')
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = orders.map((order: any) => ({
      _id: order._id.toString(),
      orderId: order.cashfreeOrderId,
      resource: order.resourceId
        ? {
            _id: order.resourceId._id.toString(),
            title: order.resourceId.title,
            thumbnailUrl: order.resourceId.thumbnailUrl,
            price: order.resourceId.price,
          }
        : null,
      amount: order.amount,
      status: order.status,
      gateway: order.gateway || null,
      paymentCaptured: order.paymentCaptured || false,
      captureStatus: order.captureStatus || null,
      couponCode: order.couponCode || null,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}