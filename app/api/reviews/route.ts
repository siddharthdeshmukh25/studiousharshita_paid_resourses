import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Review from '@/models/Review';

// GET reviews for a resource
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);
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
    const body = await request.json();
    const { resourceId, userId, userName, rating, comment } = body;

    if (!resourceId || !userId || !userName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Check how many reviews user has for this resource
    const userReviews = await Review.find({ resourceId, userId });
    
    if (userReviews.length >= 2) {
      return NextResponse.json({ error: 'Maximum 2 comments allowed per resource' }, { status: 400 });
    }

    // Create new review (user has 0 or 1 review)
    const review = await Review.create({
      resourceId,
      userId,
      userName,
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
    const body = await request.json();
    const { reviewId, rating, comment, userName } = body;

    if (!reviewId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
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
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
