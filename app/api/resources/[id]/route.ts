import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasValidCredentials } from '@/lib/drive/tokenManager';
import { hasAdminSession } from '@/lib/auth/admin';

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

    // Never expose the delivery link to the public — access is granted through
    // the authenticated download / open-drive endpoints. Admins keep it so the
    // admin panel can render the link when editing.
    const isAdmin = await hasAdminSession(request);
    const resourceObj: any = resource.toJSON();
    if (!isAdmin) {
      delete resourceObj.linkUrl;
      delete resourceObj.linkType;
    }
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
    // Only logged-in admins may update resources.
    const isAdmin = await hasAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required to update resources.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Validate images array
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0 || body.images.length > 5) {
      return NextResponse.json(
        { error: 'Invalid images array (must have 1-5 images)' },
        { status: 400 }
      );
    }

    // Keep credential validation for paid resources only. Free resources can
    // point to a publicly shared Drive/Docs link.
    const isPaidResource = Number(body.price) > 0;
    if (isPaidResource && (body.linkType === 'google_drive' || body.linkType === 'docs')) {
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

    console.log('Updating resource with images:', body.images);

    const resource = await Resource.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        price: body.price,
        discount: body.discount,
        images: body.images,
        linkType: body.linkType,
        linkUrl: body.linkUrl,
        category: body.category,
      },
      { returnDocument: 'after' }
    );

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    console.log('Updated resource images:', resource.images);

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
    // Only logged-in admins may delete resources.
    const isAdmin = await hasAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required to delete resources.' },
        { status: 401 }
      );
    }

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
