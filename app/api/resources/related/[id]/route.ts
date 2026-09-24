import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';
import mongoose from 'mongoose';

type RelatedDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  category: string;
};

/**
 * GET /api/resources/related/[id]
 * Related resources for a product page: same-category first (max 8), then the
 * newest other resources to fill any gap. Public-safe fields only — linkUrl and
 * linkType are never exposed here. Bundles themselves are not recommended.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ resources: [] });
    }

    await connectDB();

    const current = await Resource.findById(id).select('category bundleResourceIds').lean<{
      _id: mongoose.Types.ObjectId;
      category: string;
      bundleResourceIds?: mongoose.Types.ObjectId[];
    } | null>();
    if (!current) {
      return NextResponse.json({ resources: [] });
    }

    // Never recommend the current resource or (for bundles) their own children.
    const excludedIds = [id, ...(current.bundleResourceIds ?? []).map((child) => child.toString())];

    const projection = 'title description price discount images thumbnailUrl category';
    const MAX_RELATED = 8;

    const sameCategory = await Resource.find({
      _id: { $nin: excludedIds.map((rid) => new mongoose.Types.ObjectId(rid)) },
      category: current.category,
    })
      .sort({ createdAt: -1 })
      .limit(MAX_RELATED)
      .select(projection)
      .lean<RelatedDoc[]>();

    let related = [...sameCategory];

    if (related.length < MAX_RELATED) {
      const fillIds = excludedIds.concat(related.map((r) => r._id.toString()));
      const fill = await Resource.find({
        _id: { $nin: fillIds.map((rid) => new mongoose.Types.ObjectId(rid)) },
      })
        .sort({ createdAt: -1 })
        .limit(MAX_RELATED - related.length)
        .select(projection)
        .lean<RelatedDoc[]>();
      related = related.concat(fill);
    }

    const withRatings = await Promise.all(
      related.map(async (resource) => {
        const [stats] = await Review.aggregate<{ averageRating: number; reviewCount: number }>([
          { $match: { resourceId: resource._id.toString() } },
          { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
        ]);
        return {
          _id: resource._id.toString(),
          title: resource.title,
          description: resource.description,
          price: resource.price,
          discount: resource.discount ?? 0,
          images: resource.images ?? [],
          thumbnailUrl: resource.thumbnailUrl,
          category: resource.category,
          avgRating: stats?.averageRating ?? 0,
          totalReviews: stats?.reviewCount ?? 0,
        };
      })
    );

    return NextResponse.json({ resources: withRatings });
  } catch (error) {
    console.error('Related resources error:', error);
    // A broken recommendations endpoint must never break the page — return empty.
    return NextResponse.json({ resources: [] }, { status: 200 });
  }
}
