import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = {};
    
    if (category) {
      query = { category };
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

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    // Get ratings for each resource
    const resourcesWithRatings = await Promise.all(
      resources.map(async (resource) => {
        const reviews = await Review.find({ resourceId: resource._id.toString() });
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        const resourceJson = resource.toJSON();
        return {
          ...resourceJson,
          avgRating,
          totalReviews: reviews.length
        };
      })
    );

    return NextResponse.json({ resources: resourcesWithRatings });
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
    const body = await request.json();
    const { title, description, price, discount, thumbnailUrl, linkType, linkUrl, category } = body;

    if (!title || !description || !price || !thumbnailUrl || !linkType || !linkUrl || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await Resource.create({
      title,
      description,
      price,
      discount: discount || 0,
      thumbnailUrl,
      linkType,
      linkUrl,
      category,
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
