import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getDriveFileStream, getDriveFileInfo, exportDriveFileToPDF, isGoogleDocsFile } from '@/lib/drive/googleDrive';

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
    if (resource.linkType === 'notion') {
      // For Notion, redirect to the link
      console.log('Redirecting to Notion link:', resource.linkUrl);
      return NextResponse.redirect(resource.linkUrl, 302);
    }

    // For Google Drive, stream the file
    console.log('Attempting to download from Google Drive:', resource.linkUrl);
    console.log('Resource linkType:', resource.linkType);
    console.log('User ID for Drive access:', user._id.toString());
    
    try {
      // Get file info from Google Drive
      // Pass userId to use user's OAuth tokens if available
      const userId = user._id.toString();
      const fileInfo = await getDriveFileInfo(resource.linkUrl, userId);
      console.log('File info retrieved:', fileInfo);

      let fileStream;
      let mimeType;
      let fileName;

      // Check if it's a Google Docs file (document, spreadsheet, presentation)
      if (fileInfo.mimeType && isGoogleDocsFile(fileInfo.mimeType as string)) {
        console.log('Google Docs file detected, exporting to PDF');
        // Export Google Docs to PDF
        fileStream = await exportDriveFileToPDF(resource.linkUrl, userId);
        mimeType = 'application/pdf';
        const originalName = fileInfo.name || 'document';
        fileName = originalName.replace(/\.[^/.]+$/, '') + '.pdf'; // Replace extension with .pdf
      } else {
        // Regular file download
        fileStream = await getDriveFileStream(resource.linkUrl, userId);
        mimeType = fileInfo.mimeType || 'application/octet-stream';
        fileName = fileInfo.name || 'download';
      }

      // Create response with file stream
      const response = new NextResponse(fileStream as any, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      });

      return response;
    } catch (driveError: any) {
      console.error('Google Drive API failed:', driveError);
      
      // For security, don't expose direct Drive links even on error
      // Return a helpful error message that guides troubleshooting
      return NextResponse.json(
        { 
          error: 'File download is temporarily unavailable. Please contact the administrator or try again later.',
          code: 'DRIVE_ACCESS_ERROR'
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download resource' },
      { status: 500 }
    );
  }
}
