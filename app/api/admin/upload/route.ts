import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { jwtVerify } from 'jose';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Admin JWT verification
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return false;

    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    
    // Check if the token is for admin
    return payload.username !== undefined;
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'resource-thumbnails',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      secure_url: result.secure_url,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
