import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import ResourceAccessLog from '@/models/ResourceAccessLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access resources.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Await params to get the id
    const { id } = await params;

    // Get resource details
    const resource = await Resource.findById(id);
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Free resources are available to every signed-in user; paid resources require ownership.
    const isFreeResource = resource.price === 0;
    const hasAccess = isFreeResource || user.purchasedResources.some(id => id.toString() === resource._id.toString());
    if (!hasAccess) {
      console.log('User purchased resources:', user.purchasedResources.map(id => id.toString()));
      console.log('Resource ID:', resource._id.toString());
      console.log('Has access:', hasAccess);
      return NextResponse.json(
        { error: 'You have not purchased this resource' },
        { status: 403 }
      );
    }

    // This is an access event, not a claim that the user read the whole file.
    const source = new URL(request.url).searchParams.get('ref')?.slice(0, 80) || 'direct';
    await ResourceAccessLog.create({ resourceId: resource._id, userId: user._id, source });

    // Handle different link types
    if (resource.linkType === 'notion') {
      // For Notion, return the link directly
      return NextResponse.json({
        driveUrl: resource.linkUrl,
        linkType: 'notion'
      });
    }

    // For Google Drive, return the direct link regardless of admin connection status
    // This allows users to access resources even if Google Drive integration is not set up
    if (resource.linkUrl) {
      return NextResponse.json({
        driveUrl: resource.linkUrl,
        linkType: 'drive'
      });
    }

    return NextResponse.json(
      { error: 'Resource link not available' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Open Drive error:', error);
    return NextResponse.json(
      { error: 'Failed to open resource' },
      { status: 500 }
    );
  }
}
