import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/models/Review';
import Resource from '@/models/Resource';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET reviews for a resource
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    await connectDB();
    const reviews = await Review.find({ resourceId }).sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST create new review
export async function POST(request: NextRequest) {
  try {
    // Identity always comes from the server session — never from the client body.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to write a review.' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, rating, comment } = body;

    if (!resourceId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Paid resources can only be reviewed by users who purchased them.
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    const isPaidResource = resource.price > 0;
    if (isPaidResource && !user.purchasedResources.some((item) => item.toString() === resource._id.toString())) {
      return NextResponse.json(
        { error: 'You can only review resources you have purchased.' },
        { status: 403 }
      );
    }

    // Check how many reviews user has for this resource
    const userReviews = await Review.find({ resourceId, userId: session.user.id });

    if (userReviews.length >= 2) {
      return NextResponse.json({ error: 'Maximum 2 comments allowed per resource' }, { status: 400 });
    }

    // Create new review (user has 0 or 1 review)
    const review = await Review.create({
      resourceId,
      userId: session.user.id,
      userName: user.name || user.email || 'Anonymous',
      rating,
      comment,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// PUT update existing review
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, rating, comment, userName } = body;

    if (!reviewId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the review's author can edit it.
    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews.' }, { status: 403 });
    }

    review.rating = rating;
    review.comment = comment;
    if (userName) {
      review.userName = userName;
    }
    await review.save();

    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE review
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the review's author can delete it.
    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews.' }, { status: 403 });
    }

    await Review.findByIdAndDelete(reviewId);
    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}