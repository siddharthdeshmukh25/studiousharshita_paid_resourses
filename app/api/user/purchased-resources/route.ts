import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).populate('purchasedResources');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const resources = user.purchasedResources.map((resource: any) => ({
      _id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      price: resource.price,
      thumbnailUrl: resource.thumbnailUrl,
      category: resource.category,
      purchasedAt: user.updatedAt,
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
