import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Calculate total revenue from completed orders
    const completedOrders = await Order.find({ status: 'completed' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0);

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total active resources count
    const totalResources = await Resource.countDocuments();

    return NextResponse.json({
      totalRevenue,
      totalUsers,
      totalResources,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
