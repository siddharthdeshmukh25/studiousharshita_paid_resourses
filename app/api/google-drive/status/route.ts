import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Google Drive status for user:', session.user.email);
    console.log('Full user document:', { 
      email: user.email, 
      googleDriveConnected: user.googleDriveConnected, 
      hasAccessToken: !!user.googleDriveAccessToken,
      hasRefreshToken: !!user.googleDriveRefreshToken 
    });

    return NextResponse.json({
      connected: user.googleDriveConnected || false,
    });
  } catch (error) {
    console.error('Error fetching Google Drive status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connected } = body;

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Before update - User:', { email: user.email, googleDriveConnected: user.googleDriveConnected });

    const updateResult = await User.updateOne(
      { email: session.user.email },
      {
        $set: {
          googleDriveConnected: connected,
          googleDriveAccessToken: connected ? user.googleDriveAccessToken : undefined,
          googleDriveRefreshToken: connected ? user.googleDriveRefreshToken : undefined
        }
      }
    );
    
    console.log('Update result:', updateResult);
    console.log('Google Drive status updated for user:', session.user.email, 'connected:', connected);

    return NextResponse.json({ success: true, connected: connected });
  } catch (error) {
    console.error('Error updating Google Drive status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
