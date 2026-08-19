import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasValidCredentials } from '@/lib/drive/tokenManager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain JSON
    const resourceObj = resource.toJSON();
    return NextResponse.json({ resource: resourceObj });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Check if Google Drive is connected when linkType is google_drive or docs
    if (body.linkType === 'google_drive' || body.linkType === 'docs') {
      const session = await getServerSession(authOptions);
      console.log('Session user email:', session?.user?.email);
      
      const adminUser = await User.findOne({ email: session?.user?.email });
      console.log('Admin user found:', adminUser ? 'Yes' : 'No');
      console.log('Admin user email:', adminUser?.email);
      console.log('Admin user role:', adminUser?.role);
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'User not found. Please login to update resources.' },
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

    const resource = await Resource.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        price: body.price,
        discount: body.discount,
        thumbnailUrl: body.thumbnailUrl,
        linkType: body.linkType,
        linkUrl: body.linkUrl,
        category: body.category,
      },
      { new: true }
    );

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource: resource.toJSON() });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const resource = await Resource.findByIdAndDelete(id);

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
