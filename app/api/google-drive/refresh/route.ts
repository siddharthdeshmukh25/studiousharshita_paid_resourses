import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { refreshAccessToken } from '@/lib/drive/tokenManager';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Manual token refresh requested for:', session.user.email);
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    const newAccessToken = await refreshAccessToken(userId);
    
    console.log('Token refreshed successfully for user:', session.user.email);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Token refreshed successfully',
      accessToken: newAccessToken.substring(0, 20) + '...' // Only show partial token for security
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
