import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { hasValidCredentials, removeCredentials } from '@/lib/drive/tokenManager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session found in status check');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking Google Drive status for:', session.user.email);
    await connectDB();
    console.log('Database connected for status check');
    
    // Get user to get userId
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found in database for:', session.user.email);
      // Create user if not exists
      console.log('Creating user for status check:', session.user.email);
      const newUser = await User.create({
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        image: session.user.image,
        role: 'user',
        purchasedResources: [],
        googleDriveConnected: false,
      });
      console.log('User created in status check:', newUser.email);
      return NextResponse.json({ connected: false });
    }

    // Check separate GoogleDriveCredentials collection
    const userId = user._id.toString();
    const hasValidCreds = await hasValidCredentials(userId);
    
    console.log('Google Drive status for user:', session.user.email);
    console.log('Has valid credentials:', hasValidCreds);

    // Update user model for backward compatibility
    if (hasValidCreds !== user.googleDriveConnected) {
      await User.updateOne(
        { email: session.user.email },
        { $set: { googleDriveConnected: hasValidCreds } }
      );
    }

    return NextResponse.json({
      connected: hasValidCreds,
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

    // Update user model for backward compatibility
    await User.updateOne(
      { email: session.user.email },
      { $set: { googleDriveConnected: connected } }
    );

    // If disconnecting, remove credentials from separate collection
    if (!connected) {
      const userId = user._id.toString();
      await removeCredentials(userId);
      console.log('Google Drive credentials removed for user:', session.user.email);
    }
    
    console.log('Google Drive status updated for user:', session.user.email, 'connected:', connected);

    return NextResponse.json({ success: true, connected: connected });
  } catch (error) {
    console.error('Error updating Google Drive status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
