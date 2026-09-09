This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Google Drive Integration

The admin connects a Google Drive account with a one-click **Sign in with Google** flow (Admin Settings → Google Drive). The server manages all OAuth credentials via environment variables — no manual Client ID / secret entry in the UI.

### Required environment variables

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

These are the same OAuth credentials used for Google sign-in (NextAuth). The Google Drive flow requests offline access (`access_type=offline&prompt=consent`) so a refresh token is stored in the `GoogleDriveCredentials` collection and access tokens auto-refresh. The app requests **full Drive access** (`https://www.googleapis.com/auth/drive`) so buyers can be granted read access to any private file, including files uploaded manually — existing connections must reconnect once to pick up the new scope.

### One-time Google Cloud Console setup

1. **Enable the Google Drive API** for your project (APIs & Services → Library → Google Drive API).
2. **Add the authorized redirect URI** to your OAuth 2.0 Client ID (APIs & Services → Credentials → your Web client):
   ```
   {YOUR_ORIGIN}/api/google-drive/auth
   ```
   e.g. `http://localhost:3000/api/google-drive/auth` locally.
3. **Set the OAuth consent screen publishing status to "In production"** (APIs & Services → OAuth consent screen).
   - Apps left in *Testing* mode get refresh tokens that **expire after 7 days**, so the connection silently drops every week.
   - In production, tokens stay valid long-term (Google may still revoke them after ~6 months of no usage, or if the user changes their password).

### How it works

- **Connect**: Admin clicks "Connect with Google" → Google consent → callback at `/api/google-drive/auth` stores the tokens and redirects back.
- **Auto-refresh**: `lib/drive/tokenManager.ts` refreshes the access token whenever it is close to expiry.
- **On purchase**: `app/api/checkout/route.ts` grants the buyer read permission on the Drive file automatically.
- **Disconnect**: Removes stored credentials.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
