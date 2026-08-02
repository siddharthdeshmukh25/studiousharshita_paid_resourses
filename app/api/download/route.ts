import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getDriveFileStream, getDriveFileInfo } from '@/lib/drive/googleDrive';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to download resources.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user from database using ID from JWT token
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Verify user owns this resource
    if (!user.purchasedResources.includes(resource._id)) {
      return NextResponse.json(
        { error: 'You have not purchased this resource' },
        { status: 403 }
      );
    }

    // Handle different link types
    if (resource.linkType === 'notion' || resource.linkType === 'docs') {
      // For Notion and Docs, redirect to the link
      return NextResponse.redirect(resource.linkUrl, 302);
    }

    // For Google Drive, stream the file
    // Get file info from Google Drive
    const fileInfo = await getDriveFileInfo(resource.linkUrl);

    // Get file stream from Google Drive
    const fileStream = await getDriveFileStream(resource.linkUrl);

    // Create response with file stream
    const response = new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': fileInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileInfo.name}"`,
        'Content-Length': fileInfo.size || '0',
        'Cache-Control': 'no-cache',
      },
    });

    return response;

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download resource' },
      { status: 500 }
    );
  }
}
