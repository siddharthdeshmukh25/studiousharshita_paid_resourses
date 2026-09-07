import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }

    await connectDB();

    console.log('Fetching purchased resources for user ID:', session.user.id);
    console.log('Session user email:', session.user.email);

    const user = await User.findById(session.user.id).populate('purchasedResources');
    
    if (!user) {
      console.log('User not found with ID:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', user.email);
    console.log('Purchased resources count:', user.purchasedResources.length);
    console.log('Purchased resource IDs:', user.purchasedResources.map((r: any) => r._id.toString())); // eslint-disable-line @typescript-eslint/no-explicit-any

    // Find the actual purchase date from completed orders instead of using
    // the user document's updatedAt (which changes on unrelated updates).
    const completedOrders = await Order.find({
      userId: user._id,
      status: 'completed',
    })
      .sort({ createdAt: 1 })
      .select('resourceId createdAt')
      .lean();

    const purchaseDates = new Map<string, string>();
    for (const order of completedOrders) {
      const resourceId = order.resourceId?.toString();
      if (resourceId && !purchaseDates.has(resourceId)) {
        purchaseDates.set(resourceId, order.createdAt.toISOString());
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resources = user.purchasedResources.map((resource: any) => ({
      _id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      price: resource.price,
      thumbnailUrl: resource.thumbnailUrl,
      category: resource.category,
      purchasedAt: purchaseDates.get(resource._id.toString()) || user.updatedAt,
    }));

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching purchased resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased resources' },
      { status: 500 }
    );
  }
}
