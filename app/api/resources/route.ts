import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';
import User from '@/models/User';
import GoogleDriveCredentials from '@/models/GoogleDriveCredentials';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasValidCredentials } from '@/lib/drive/tokenManager';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const access = searchParams.get('access');

    console.log('API Request - Category:', category, 'Search:', search);

    let query = {};
    
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

    const resources = await Resource.find(query).sort({ createdAt: -1 });

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

    if (!title || !description || price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0 || !thumbnailUrl || !linkType || !linkUrl || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
