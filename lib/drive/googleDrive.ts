import { google } from 'googleapis';
import { getValidAccessToken } from './tokenManager';

// Service account for admin operations
const serviceAccountAuth = new google.auth.GoogleAuth({
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

const serviceAccountDrive = google.drive({ version: 'v3', auth: serviceAccountAuth });

// User OAuth for user-specific files
async function getUserDriveClient(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken,
  });
  
  return google.drive({ version: 'v3', auth: oauth2Client });
}

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

export async function getDriveFileStream(fileUrl: string, userId?: string) {
  try {
    const fileId = extractFileId(fileUrl);
    
    // Use user's OAuth client if userId is provided, otherwise use service account
    const drive = userId ? await getUserDriveClient(userId) : serviceAccountDrive;
    
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

export async function getDriveFileInfo(fileUrl: string, userId?: string) {
  try {
    const fileId = extractFileId(fileUrl);
    console.log('Extracted file ID:', fileId);
    console.log('Original URL:', fileUrl);
    
    // Use user's OAuth client if userId is provided, otherwise use service account
    const drive = userId ? await getUserDriveClient(userId) : serviceAccountDrive;
    
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, size',
    });

    console.log('Drive API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching file info from Google Drive:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 404) {
      throw new Error('File not found. Please ensure the file exists in Google Drive and is shared with the service account email.');
    } else if (error.code === 403) {
      throw new Error('Access denied. Please ensure the service account has permission to access this file.');
    } else {
      throw new Error(`Failed to fetch file info from Google Drive: ${error.message}`);
    }
  }
}

// Export Google Docs to PDF
export async function exportDriveFileToPDF(fileUrl: string, userId?: string) {
  try {
    const fileId = extractFileId(fileUrl);
    console.log('Exporting file to PDF:', fileId);
    
    // Use user's OAuth client if userId is provided, otherwise use service account
    const drive = userId ? await getUserDriveClient(userId) : serviceAccountDrive;
    
    const response = await drive.files.export(
      {
        fileId: fileId,
        mimeType: 'application/pdf',
      },
      { responseType: 'stream' }
    );

    return response.data;
  } catch (error) {
    console.error('Error exporting file to PDF:', error);
    throw new Error('Failed to export file to PDF');
  }
}

// Check if file is a Google Doc/Sheet/Slides
export function isGoogleDocsFile(mimeType: string): boolean {
  const googleDocMimeTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
  ];
  return googleDocMimeTypes.includes(mimeType);
}

// Grant Google Drive file permission to a user
export async function grantFilePermission(fileUrl: string, userEmail: string, adminUserId?: string): Promise<void> {
  try {
    const fileId = extractFileId(fileUrl);
    console.log('Granting permission for file:', fileId, 'to user:', userEmail);
    
    // Use admin's Google Drive credentials
    const drive = adminUserId ? await getUserDriveClient(adminUserId) : serviceAccountDrive;
    
    // Grant reader permission to the user
    const permission = {
      role: 'reader',
      type: 'user',
      emailAddress: userEmail,
    };
    
    await drive.permissions.create({
      fileId: fileId,
      requestBody: permission,
      fields: 'id',
    });
    
    console.log('Permission granted successfully to:', userEmail);
  } catch (error) {
    console.error('Error granting permission:', error);
    throw new Error(`Failed to grant permission to ${userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Revoke Google Drive file permission from a user
export async function revokeFilePermission(fileUrl: string, userEmail: string, adminUserId?: string): Promise<void> {
  try {
    const fileId = extractFileId(fileUrl);
    console.log('Revoking permission for file:', fileId, 'from user:', userEmail);
    
    // Use admin's Google Drive credentials
    const drive = adminUserId ? await getUserDriveClient(adminUserId) : serviceAccountDrive;
    
    // Get all permissions for the file
    const permissions = await drive.permissions.list({
      fileId: fileId,
      fields: 'permissions(id, emailAddress, type)',
    });
    
    // Find the permission for the specific user
    const userPermission = permissions.data.permissions?.find(
      (perm: any) => perm.type === 'user' && perm.emailAddress === userEmail
    );
    
    if (userPermission && userPermission.id) {
      await drive.permissions.delete({
        fileId: fileId,
        permissionId: userPermission.id,
      });
      console.log('Permission revoked successfully from:', userEmail);
    } else {
      console.log('No permission found for user:', userEmail);
    }
  } catch (error) {
    console.error('Error revoking permission:', error);
    throw new Error(`Failed to revoke permission from ${userEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
