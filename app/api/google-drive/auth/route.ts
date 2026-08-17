import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/admin?error=oauth_error', request.url));
  }

  if (!code) {
    // Redirect to Google OAuth consent screen
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      return NextResponse.redirect(new URL('/admin?error=no_session', request.url));
    }
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/google-drive/auth';
    const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
    
    if (!clientId || !redirectUri) {
      return NextResponse.redirect(new URL('/admin?error=missing_credentials', request.url));
    }
    
    // Pass user email in state parameter to identify user on callback
    const state = encodeURIComponent(userEmail);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent&state=${state}`;
    
    return NextResponse.redirect(authUrl);
  }

  // Exchange authorization code for access token
  try {
    const state = searchParams.get('state');
    const userEmail = state ? decodeURIComponent(state) : null;
    
    console.log('User email from state:', userEmail);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/google-drive/auth';

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing OAuth credentials');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      // Log error without sensitive details
      console.error('OAuth token exchange failed:', tokenData.error);
      throw new Error('Failed to exchange code for token');
    }

    // Store tokens in database using email from state
    if (userEmail) {
      await connectDB();
      const user = await User.findOne({ email: userEmail });
      console.log('User found:', user ? 'Yes' : 'No');
      console.log('User document before update:', user ? { email: user.email, googleDriveConnected: user.googleDriveConnected, allFields: Object.keys(user.toObject()) } : null);
      
      if (user) {
        // Use updateOne to ensure fields are added to existing documents
        const updateResult = await User.updateOne(
          { email: userEmail },
          {
            $set: {
              googleDriveConnected: true,
              googleDriveAccessToken: tokenData.access_token,
              googleDriveRefreshToken: tokenData.refresh_token
            }
          },
          { upsert: true }
        );
        console.log('Update result:', { matchedCount: updateResult.matchedCount, modifiedCount: updateResult.modifiedCount, upsertedCount: updateResult.upsertedCount });
        console.log('Google Drive connection saved to database for user:', userEmail);
        
        // Verify the save
        const updatedUser = await User.findOne({ email: userEmail });
        console.log('User document after update:', updatedUser ? { email: updatedUser.email, googleDriveConnected: updatedUser.googleDriveConnected, hasToken: !!updatedUser.googleDriveAccessToken, allFields: Object.keys(updatedUser.toObject()) } : null);
      } else {
        console.error('User not found in database for email:', userEmail);
      }
    } else {
      console.error('No user email found in state');
    }

    return NextResponse.redirect(new URL('/admin?google_drive_connected=true', request.url));
  } catch (error) {
    // Log generic error without sensitive details
    console.error('OAuth token exchange error');
    return NextResponse.redirect(new URL('/admin?error=token_exchange_failed', request.url));
  }
}
