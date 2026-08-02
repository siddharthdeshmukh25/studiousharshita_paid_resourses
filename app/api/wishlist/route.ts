import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Wishlist from '@/models/Wishlist';
import Review from '@/models/Review';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const wishlistItems = await Wishlist.find({ userId: session.user.id })
      .populate('resourceId')
      .sort({ createdAt: -1 });

    // Get ratings for each resource in wishlist
    const wishlistWithRatings = await Promise.all(
      wishlistItems.map(async (item) => {
        const reviews = await Review.find({ resourceId: item.resourceId._id.toString() });
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        const itemJson = item.toJSON();
        return {
          ...itemJson,
          resourceId: {
            ...itemJson.resourceId,
            avgRating,
            totalReviews: reviews.length
          }
        };
      })
    );

    return NextResponse.json({ wishlist: wishlistWithRatings });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json({ error: 'Failed to get wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({ userId: session.user.id, resourceId });
    if (existingItem) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
    }

    const wishlistItem = await Wishlist.create({
      userId: session.user.id,
      resourceId,
    });

    return NextResponse.json({ success: true, wishlistItem });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    await connectDB();

    await Wishlist.deleteOne({ userId: session.user.id, resourceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
