import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

interface StatReview {
  userName: string;
  rating: number;
  comment: string;
  resourceTitle: string;
}

/**
 * Public, non-sensitive stats for the home page: resource/student counts,
 * average rating and a few recent high-rated reviews for testimonials.
 * No auth required; nothing user-identifiable is exposed.
 */
export async function GET() {
  try {
    await connectDB();

    const [totalResources, totalUsers, ratingAgg, topReviews] = await Promise.all([
      Resource.countDocuments({}),
      User.countDocuments({ role: 'user' }),
      Review.aggregate<{ avg: number; count: number }>([
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      // Recent reviews with a comment, 4+ stars, for the testimonials strip.
      Review.find({ rating: { $gte: 4 }, comment: { $ne: '' } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    const avgRating = ratingAgg[0]?.avg ?? 0;

    // Attach resource titles to reviews for context ("— on <resource>").
    const resourceIds = Array.from(new Set(topReviews.map((r) => r.resourceId)));
    const resources = resourceIds.length
      ? await Resource.find({ _id: { $in: resourceIds } }).select('title').lean()
      : [];
    const titleById = new Map(resources.map((r) => [String(r._id), r.title]));

    const reviews: StatReview[] = topReviews.map((r) => ({
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      resourceTitle: titleById.get(r.resourceId) || '',
    }));

    return NextResponse.json({
      totalResources,
      totalStudents: totalUsers,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: ratingAgg[0]?.count ?? 0,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { totalResources: 0, totalStudents: 0, avgRating: 0, totalReviews: 0, reviews: [] },
      { status: 200 }
    );
  }
}
