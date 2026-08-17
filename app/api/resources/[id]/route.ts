import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';

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
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser || !adminUser.googleDriveConnected) {
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
