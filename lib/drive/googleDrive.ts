import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Keep this separate from GOOGLE_CLIENT_ID, which is used by NextAuth's
    // Google OAuth provider.
    client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || 'googleapis.com',
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

// Extract file ID from Google Drive URL
function extractFileId(url: string): string {
  // Handle various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no match, assume the URL is already a file ID
  return url;
}

export async function getDriveFileStream(fileUrl: string) {
  try {
    const fileId = extractFileId(fileUrl);
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching file from Google Drive:', error);
    throw new Error('Failed to fetch file from Google Drive');
  }
}

export async function getDriveFileInfo(fileUrl: string) {
  try {
    const fileId = extractFileId(fileUrl);
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, size',
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching file info from Google Drive:', error);
    throw new Error('Failed to fetch file info from Google Drive');
  }
}
