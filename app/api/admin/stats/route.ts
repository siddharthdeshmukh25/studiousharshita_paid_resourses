import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Calculate total revenue from completed orders OR successfully captured payments
    // This handles both old orders (status: completed) and new orders (paymentCaptured: true)
    const successfulOrders = await Order.find({
      $or: [
        { status: 'completed' },
        { paymentCaptured: true }
      ]
    });
    
    const totalRevenue = successfulOrders.reduce((sum, order) => sum + order.amount, 0);

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total active resources count
    const totalResources = await Resource.countDocuments();

    // Get total orders count for debugging
    const totalOrders = await Order.countDocuments();
    const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
    const capturedOrdersCount = await Order.countDocuments({ paymentCaptured: true });

    console.log('Stats:', {
      totalRevenue,
      totalUsers,
      totalResources,
      totalOrders,
      completedOrdersCount,
      capturedOrdersCount
    });

    return NextResponse.json({
      totalRevenue,
      totalUsers,
      totalResources,
      totalOrders,
      completedOrdersCount,
      capturedOrdersCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
