import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { storeCredentials } from '@/lib/drive/tokenManager';

const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive';

const DEFAULT_RETURN_TO = '/admin';

interface OAuthState {
  email?: string;
  returnTo?: string;
}

function isSafePath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

function parseState(raw: string | null): OAuthState {
  if (!raw) return {};
  const decoded = decodeURIComponent(raw);
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') {
      return {
        email: typeof parsed.email === 'string' ? parsed.email : undefined,
        returnTo: isSafePath(parsed.returnTo) ? parsed.returnTo : undefined,
      };
    }
  } catch {
    // Legacy state format: the raw user email
    if (decoded.includes('@')) {
      return { email: decoded };
    }
  }
  return {};
}

function buildReturnUrl(state: OAuthState, params: Record<string, string>): string {
  const base = isSafePath(state.returnTo) ? state.returnTo : DEFAULT_RETURN_TO;
  const separator = base.includes('?') ? '&' : '?';
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}${separator}${query}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  let state: OAuthState = {};

  if (error) {
    state = parseState(searchParams.get('state'));
    return NextResponse.redirect(new URL(buildReturnUrl(state, { error }), request.url));
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

    if (!clientId || !redirectUri) {
      return NextResponse.redirect(new URL('/admin?error=missing_credentials', request.url));
    }

    // Where to land after OAuth completes. Only allow same-site relative paths.
    const requestedReturn = searchParams.get('returnTo');
    const returnTo = isSafePath(requestedReturn) ? requestedReturn : DEFAULT_RETURN_TO;

    // Pass user email and return path in state parameter to identify user on callback
    const stateParam = encodeURIComponent(JSON.stringify({ email: userEmail, returnTo }));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(DRIVE_SCOPE)}&response_type=code&access_type=offline&prompt=consent&state=${stateParam}`;

    console.log('Redirecting to Google OAuth for user:', userEmail);
    return NextResponse.redirect(authUrl);
  }

  // Exchange authorization code for access token
  try {
    state = parseState(searchParams.get('state'));
    let userEmail = state.email;

    console.log('OAuth callback received');
    console.log('User email from state:', userEmail);

    // Validate the state email against the current session before storing tokens
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      if (userEmail && userEmail !== session.user.email) {
        console.error('State email mismatch:', userEmail, 'vs session:', session.user.email);
        return NextResponse.redirect(new URL(buildReturnUrl(state, { error: 'user_mismatch' }), request.url));
      }
      userEmail = session.user.email;
    }

    if (!userEmail) {
      console.error('No user email found in state or session');
      return NextResponse.redirect(new URL(buildReturnUrl(state, { error: 'no_user' }), request.url));
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
      error: tokenData.error,
    });

    if (tokenData.error) {
      // Log error without sensitive details
      console.error('OAuth token exchange failed:', tokenData.error);
      console.error('Error details:', tokenData.error_description || 'No description');
      throw new Error('Failed to exchange code for token');
    }

    if (!tokenData.access_token) {
      console.error('Missing access token in response');
      throw new Error('Incomplete token response from Google');
    }

    console.log('Token exchange successful');

    // Store tokens in database using email from state
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
        tokenData.refresh_token || '',
        DRIVE_SCOPE
      );
      console.log('Google Drive credentials saved to GoogleDriveCredentials model for user:', userEmail);

      // Also update User model for backward compatibility
      await User.updateOne(
        { email: userEmail },
        {
          $set: {
            googleDriveConnected: true,
            googleDriveAccessToken: tokenData.access_token,
            googleDriveRefreshToken: tokenData.refresh_token || '',
          },
        }
      );
      console.log('User model also updated for backward compatibility');
    } else {
      console.error('User not found in database for email:', userEmail);
    }

    return NextResponse.redirect(new URL(buildReturnUrl(state, { google_drive_connected: 'true' }), request.url));
  } catch (error) {
    // Log generic error without sensitive details
    console.error('OAuth token exchange error:', error);
    return NextResponse.redirect(new URL(buildReturnUrl(state, { error: 'token_exchange_failed' }), request.url));
  }
}