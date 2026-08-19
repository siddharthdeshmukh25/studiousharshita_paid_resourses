import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { storeCredentials } from '@/lib/drive/tokenManager';

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
      console.log('No session found, redirecting to home for login');
      return NextResponse.redirect(new URL('/?error=login_required', request.url));
    }
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = new URL('/api/google-drive/auth', request.url).origin + '/api/google-drive/auth';
    const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
    
    if (!clientId || !redirectUri) {
      return NextResponse.redirect(new URL('/admin?error=missing_credentials', request.url));
    }
    
    // Pass user email in state parameter to identify user on callback
    const state = encodeURIComponent(userEmail);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent&state=${state}`;
    
    console.log('Redirecting to Google OAuth for user:', userEmail);
    return NextResponse.redirect(authUrl);
  }

  // Exchange authorization code for access token
  try {
    const state = searchParams.get('state');
    let userEmail = state ? decodeURIComponent(state) : null;
    
    console.log('OAuth callback received');
    console.log('User email from state:', userEmail);

    // If no email in state, try to get from session
    if (!userEmail) {
      console.log('No email in state, trying to get from session');
      const session = await getServerSession(authOptions);
      userEmail = session?.user?.email;
      console.log('User email from session:', userEmail);
    }

    if (!userEmail) {
      console.error('No user email found in state or session');
      return NextResponse.redirect(new URL('/admin?error=no_user', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = new URL('/api/google-drive/auth', request.url).origin + '/api/google-drive/auth';

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

    console.log('Token response received:', { 
      hasAccessToken: !!tokenData.access_token, 
      hasRefreshToken: !!tokenData.refresh_token,
      error: tokenData.error 
    });

    if (tokenData.error) {
      // Log error without sensitive details
      console.error('OAuth token exchange failed:', tokenData.error);
      console.error('Error details:', tokenData.error_description || 'No description');
      throw new Error('Failed to exchange code for token');
    }

    if (!tokenData.access_token || !tokenData.refresh_token) {
      console.error('Missing tokens in response');
      throw new Error('Incomplete token response from Google');
    }

    console.log('Token exchange successful');

    // Store tokens in database using email from state
    if (userEmail) {
      console.log('Connecting to database...');
      await connectDB();
      console.log('Database connected successfully');
      
      const user = await User.findOne({ email: userEmail });
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (user) {
        // Store credentials in GoogleDriveCredentials model
        console.log('Storing Google Drive credentials in GoogleDriveCredentials model');
        await storeCredentials(
          user._id.toString(),
          userEmail,
          tokenData.access_token,
          tokenData.refresh_token,
          'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly'
        );
        console.log('Google Drive credentials saved to GoogleDriveCredentials model for user:', userEmail);
        
        // Also update User model for backward compatibility
        await User.updateOne(
          { email: userEmail },
          {
            $set: {
              googleDriveConnected: true,
              googleDriveAccessToken: tokenData.access_token,
              googleDriveRefreshToken: tokenData.refresh_token
            }
          }
        );
        console.log('User model also updated for backward compatibility');
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
