# Google Drive API Setup Instructions

To enable secure file downloads that hide the actual Google Drive links from users, you need to set up Google Drive API credentials.

## Required Environment Variables

Add these to your `.env` file:

```
# Google Service Account Credentials (for Drive API)
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=your-service-account-client-id
GOOGLE_UNIVERSE_DOMAIN=googleapis.com
```

## How to Get These Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Go to IAM & Admin → Service Accounts
5. Create a new service account
6. Download the JSON key file
7. Copy the values from the JSON file to your .env

## Important Notes

- The private key should be formatted with \n for line breaks
- The service account needs access to the Google Drive files
- Share the Drive files/folders with the service account email
