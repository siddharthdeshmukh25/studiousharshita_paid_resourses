<div align="center">

# Studious Harshita

### Study resources, thoughtful tools, and digital downloads for students.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## About

Studious Harshita is a student-focused digital resource store built with Next.js. Visitors can browse free study resources, discover premium notes and planners, and access purchased downloads through their account.

This repository contains the storefront, resource browsing and detail pages, account flows, admin tools, payment integrations, Google Drive delivery, and optional AdSense display placements.

## Tech stack

- **Framework:** Next.js App Router
- **UI:** React, TypeScript, Tailwind CSS
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth with Google sign-in
- **Payments:** Cashfree and Razorpay integrations
- **Digital delivery:** Google Drive API
- **Media:** Cloudinary

## Getting started

### Requirements

- Node.js version compatible with the project's Next.js version
- npm (the repository includes `package-lock.json`)
- The environment values required for the integrations you want to run

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To create and run a production build:

```bash
npm run build
npm start
```

To check lint rules:

```bash
npm run lint
```

> Some features require external credentials and services. Configure only the integrations you need for your local environment.

## Google AdSense: free resources only

The app is wired for **manual responsive AdSense display units**, not site-wide Auto ads. Ads are rendered only on free-resource placements; paid resource listings and paid resource detail pages do not render these units.

### Placement map

| Placement | Where it appears | Slot variable |
| --- | --- | --- |
| Free resource listing | After the fourth free resource card | `NEXT_PUBLIC_ADSENSE_SLOT_FREE_RESOURCES` |
| Free resource detail — mobile | In normal page flow after the detail/review content, up to 767px wide | `NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_INLINE` |
| Free resource detail — desktop left | Left outer gutter, beyond the original content width on wide screens (1520px+) | `NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_LEFT` |
| Free resource detail — desktop right | Right outer gutter, beyond the original content width on wide screens (1520px+) | `NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_RIGHT` |

The mobile unit is **not** a fixed bottom anchor. Desktop side units use the outer gutters and appear only on wide screens (1520px and above); they do not resize or replace the original centered detail layout. Each placement is optional: if its slot ID is unset, that ad unit is omitted and no empty ad box is shown.

### 1. Create the AdSense units

1. Get approval for your site in Google AdSense.
2. In AdSense, create a **display ad unit** for each placement you want to use.
3. Copy the numeric ad unit ID (the `data-ad-slot` value) for each unit. The publisher ID alone does not identify a display unit.
4. Use distinct ad units for listing, mobile detail, desktop left, and desktop right placements.

### 2. Configure environment variables

Set these in `.env.local` for local development and in your hosting provider's environment settings for production:

```dotenv
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-9013540088743372
NEXT_PUBLIC_ADSENSE_SLOT_FREE_RESOURCES=your_listing_slot_id
NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_INLINE=your_mobile_detail_slot_id
NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_LEFT=your_desktop_left_slot_id
NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_RIGHT=your_desktop_right_slot_id
```

Replace each `your_..._slot_id` placeholder with the matching ID from AdSense. Keep the publisher ID in the `ca-pub-...` format. You may leave any placement variable empty to disable only that placement. After changing environment variables, restart the dev server or redeploy the app so Next.js picks up the values.

> `NEXT_PUBLIC_` values are included in browser code and are not secrets. Never put API keys, OAuth secrets, or private credentials in these variables.

### 3. Verify the setup

- Confirm the site is approved and the publisher ID matches the AdSense account.
- Check the free resource listing and free resource details at mobile, desktop, and wide-desktop viewport sizes.
- Check the paid listing (`/resources?type=paid`) and paid resource details; these placements must remain absent.
- Allow time for Google to review the site and begin serving ads. A configured slot can remain unfilled while the site or ad unit is being reviewed, when no ad is available, or when an ad blocker is active.
- Keep the [Privacy Policy](/privacy-policy) accurate for advertising cookies and personalization.

Do **not** add the site-wide Auto ads script as well as these manual units unless you have separately configured and verified AdSense page exclusions for paid pages. With the current shared resource-detail URL pattern, manual units provide the intended free-only control.

Implementation lives in [`lib/adsense.ts`](lib/adsense.ts), [`components/ads/AdSlot.tsx`](components/ads/AdSlot.tsx), [`components/resources/ResourcesBrowser.tsx`](components/resources/ResourcesBrowser.tsx), and [`app/resource/[id]/page.tsx`](app/resource/%5Bid%5D/page.tsx).

## Google Drive resource delivery

The admin can connect Google Drive from **Admin Settings → Google Drive**. The server stores OAuth credentials and grants buyers access to purchased files.

Configure the OAuth credentials in the server environment:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

One-time Google Cloud setup:

1. Enable the Google Drive API in the project.
2. Add `{YOUR_ORIGIN}/api/google-drive/auth` as an authorized redirect URI for the OAuth client. For local development, this is usually `http://localhost:3000/api/google-drive/auth`.
3. Publish the OAuth consent screen as appropriate for your application. Google OAuth testing-mode refresh tokens may expire after seven days.

The Drive integration requests the Drive scope required to share files with buyers. Existing connections may need to reconnect after scope changes.

## Project structure

```text
app/                 Next.js routes, pages, and API endpoints
components/           Shared interface and feature components
contexts/             React contexts
lib/                  Integrations, configuration, and utilities
models/               Mongoose models
public/                Static files
```

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Run the TypeScript check |
| `npm run build` | Build the production app |
| `npm start` | Serve the production build |

## Deployment

Deploy this Next.js app using a platform that supports Next.js App Router applications. Add the required production environment variables in the hosting dashboard before deploying. Never commit `.env.local` or production credentials.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [React documentation](https://react.dev/)
- [Google AdSense Help](https://support.google.com/adsense/)
- [Google Drive API documentation](https://developers.google.com/drive/api/guides/about-sdk)
