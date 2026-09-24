import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';
import User from '@/models/User';
import GoogleDriveCredentials from '@/models/GoogleDriveCredentials';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasValidCredentials } from '@/lib/drive/tokenManager';
import { hasAdminSession } from '@/lib/auth/admin';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Admins see the delivery link so they can edit resources; public visitors
    // must never receive linkUrl/linkType — paid content would be leaked.
    const isAdmin = await hasAdminSession(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const access = searchParams.get('access');
    const sort = (searchParams.get('sort') || 'newest').toLowerCase();
    const minRating = Number(searchParams.get('minRating')) || 0;
    const idsParam = (searchParams.get('ids') || '').trim();

    console.log('API Request - Category:', category, 'Search:', search, 'Sort:', sort);

    let query: Record<string, unknown> = {};
    
    if (category && category !== 'All') {
      query = { category };
      console.log('Category Query:', query);
    }
    
    if (access === 'free') {
      query = { ...query, price: 0 };
    } else if (access === 'paid') {
      query = { ...query, price: { $gt: 0 } };
    }

    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Ordered lookup for "recently viewed": fetch only these ids (max 20).
    const requestedIds = Array.from(
      new Set(
        idsParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      )
    );

    if (idsParam && requestedIds.length === 0) {
      return NextResponse.json({ resources: [] });
    }
    if (requestedIds.length > 0) {
      query = { ...query, _id: { $in: requestedIds.map((id) => new mongoose.Types.ObjectId(id)) } };
    }

    // Rating sort happens after reviews are aggregated below; everything else sorts in the DB.
    const dbSort: Record<string, 1 | -1> =
      sort === 'oldest'
        ? { createdAt: 1 }
        : sort === 'price_asc'
          ? { price: 1, createdAt: -1 }
          : sort === 'price_desc'
            ? { price: -1, createdAt: -1 }
            : { createdAt: -1 };

    const resources = await Resource.find(query).sort(dbSort);

    console.log('Found resources:', resources.length, 'for query:', query);
    
    // Log all resources and their categories for debugging
    if (category && category !== 'All') {
      const allResources = await Resource.find({});
      console.log('All resources in DB:');
      allResources.forEach(r => {
        console.log(`- Title: ${r.title}, Category: "${r.category}"`);
      });
    }

    // Get ratings for each resource
    let resourcesWithRatings = await Promise.all(
      resources.map(async (resource) => {
        const reviews = await Review.find({ resourceId: resource._id.toString() });
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        const resourceJson: any = resource.toJSON();
        if (!isAdmin) {
          delete resourceJson.linkUrl;
          delete resourceJson.linkType;
        }
        return {
          ...resourceJson,
          avgRating,
          totalReviews: reviews.length
        };
      })
    );

    // "Recently viewed" keeps the client's order (newest-first from localStorage).
    if (requestedIds.length > 0) {
      const order = new Map(requestedIds.map((id, index) => [id, index]));
      resourcesWithRatings.sort(
        (a, b) => (order.get(String(a._id)) ?? 999) - (order.get(String(b._id)) ?? 999)
      );
    } else if (sort === 'rating') {
      resourcesWithRatings.sort(
        (a, b) =>
          b.avgRating - a.avgRating ||
          b.totalReviews - a.totalReviews ||
          new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      );
    }

    // Rating floor (e.g. minRating=4 → 4★+ only), applied after aggregation.
    const filtered =
      minRating > 0 && minRating <= 5
        ? resourcesWithRatings.filter((r) => r.avgRating >= minRating)
        : resourcesWithRatings;

    return NextResponse.json({ resources: filtered });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only logged-in admins may create resources.
    const isAdmin = await hasAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required to create resources.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, price, discount, images, linkType, linkUrl, category, sampleUrl, bundleResourceIds } = body;

    if (!title || !description || price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0 || !images || !Array.isArray(images) || images.length === 0 || images.length > 5 || !linkType || !category) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid images array (must have 1-5 images)' },
        { status: 400 }
      );
    }

    // Bundles: optional list of child resources. Non-bundles keep the old rule:
    // a delivery link is required.
    const bundleIds = Array.isArray(bundleResourceIds)
      ? Array.from(new Set(bundleResourceIds.filter((rid: unknown) => typeof rid === 'string' && mongoose.Types.ObjectId.isValid(rid))))
      : [];
    if (!linkUrl && bundleIds.length === 0) {
      return NextResponse.json(
        { error: 'A delivery link is required (or add bundle contents to create a combo pack).' },
        { status: 400 }
      );
    }
    if (bundleIds.includes(String(body._id || ''))) {
      return NextResponse.json({ error: 'A bundle cannot include itself.' }, { status: 400 });
    }

    await connectDB();

    // Paid Drive resources need the admin's Google credentials. Free resources
    // can use a publicly shared Drive/Docs link without that connection.
    const isPaidResource = Number(price) > 0;
    if (isPaidResource && (linkType === 'google_drive' || linkType === 'docs')) {
      const session = await getServerSession(authOptions);
      console.log('Session user email:', session?.user?.email);
      
      const adminUser = await User.findOne({ email: session?.user?.email });
      console.log('Admin user found:', adminUser ? 'Yes' : 'No');
      console.log('Admin user email:', adminUser?.email);
      console.log('Admin user role:', adminUser?.role);
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'User not found. Please login to add resources.' },
          { status: 401 }
        );
      }
      
      // Check separate GoogleDriveCredentials collection
      const userId = adminUser._id.toString();
      const hasValidCreds = await hasValidCredentials(userId);
      console.log('Has valid Google Drive credentials:', hasValidCreds);
      
      if (!hasValidCreds) {
        return NextResponse.json(
          { error: 'Google Drive is not connected. Please connect your Google Drive account in Settings before adding Google Drive resources.' },
          { status: 400 }
        );
      }
    }

    const resource = await Resource.create({
      title,
      description,
      price,
      discount: discount || 0,
      images,
      // Keep the first image as the canonical thumbnail — the SEO layout and
      // admin fallbacks read it when rendering share previews.
      thumbnailUrl: images[0],
      linkType,
      linkUrl: linkUrl || '',
      category,
      sampleUrl: typeof sampleUrl === 'string' && sampleUrl.trim() ? sampleUrl.trim() : undefined,
      bundleResourceIds: bundleIds,
    });

    // Convert to plain JSON
    const resourceJson = resource.toJSON();
    return NextResponse.json({ resource: resourceJson }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
