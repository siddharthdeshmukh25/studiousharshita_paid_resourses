import connectDB from '@/lib/db/mongodb';
import GoogleDriveCredentials from '@/models/GoogleDriveCredentials';

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiry: Date;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  await connectDB();
  
  const credentials = await GoogleDriveCredentials.findOne({ userId });
  
  if (!credentials) {
    throw new Error('No Google Drive credentials found for user');
  }
  
  // Check if token is expired or will expire in next 5 minutes
  const now = new Date();
  const expiryTime = new Date(credentials.tokenExpiry);
  const timeUntilExpiry = expiryTime.getTime() - now.getTime();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  if (timeUntilExpiry < fiveMinutes) {
    console.log('Token expired or expiring soon, refreshing...');
    return await refreshAccessToken(userId);
  }
  
  return credentials.accessToken;
}

export async function refreshAccessToken(userId: string): Promise<string> {
  await connectDB();
  
  const credentials = await GoogleDriveCredentials.findOne({ userId });
  
  if (!credentials || !credentials.refreshToken) {
    throw new Error('No refresh token available for user');
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing OAuth credentials');
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: credentials.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token refresh failed:', tokenData.error);
      throw new Error('Failed to refresh access token');
    }
    
    // Calculate new expiry time (access tokens typically last 1 hour)
    const expiryTime = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Update credentials in database
    await GoogleDriveCredentials.updateOne(
      { userId },
      {
        $set: {
          accessToken: tokenData.access_token,
          tokenExpiry: expiryTime,
        }
      }
    );
    
    console.log('Token refreshed successfully for user:', userId);
    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

export async function storeCredentials(
  userId: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  scope: string
): Promise<void> {
  await connectDB();
  
  // Calculate expiry time (access tokens typically last 1 hour)
  const expiryTime = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour
  
  await GoogleDriveCredentials.findOneAndUpdate(
    { userId },
    {
      userId,
      email,
      accessToken,
      refreshToken,
      tokenExpiry: expiryTime,
      scope,
    },
    { upsert: true, new: true }
  );
  
  console.log('Google Drive credentials stored for user:', email);
}

export async function removeCredentials(userId: string): Promise<void> {
  await connectDB();
  
  await GoogleDriveCredentials.deleteOne({ userId });
  console.log('Google Drive credentials removed for user:', userId);
}

export async function hasValidCredentials(userId: string): Promise<boolean> {
  await connectDB();
  
  const credentials = await GoogleDriveCredentials.findOne({ userId });
  
  if (!credentials) {
    return false;
  }
  
  // Check if token is expired
  const now = new Date();
  const expiryTime = new Date(credentials.tokenExpiry);
  
  return expiryTime > now;
}
