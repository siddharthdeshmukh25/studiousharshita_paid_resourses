# Studious Harshita — Study Resources Platform

A student-focused platform for discovering and purchasing study resources, notes, planners, and digital products. Includes Google sign-in, secure checkout, digital delivery, user profiles, referral earnings, and an admin workspace.

## About

Studious Harshita helps students across India study smarter with free and premium learning resources, study guides, productivity tools, and scholarship materials.

## Built with

- **Languages:** TypeScript, JavaScript, CSS
- **Framework:** Next.js App Router (React)
- **Styling:** Tailwind CSS
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js with Google sign-in
- **Payments:** Cashfree and Razorpay
- **Digital delivery:** Google Drive API
- **Media:** Cloudinary
- **UI icons:** Lucide React

## Tags

`education` `study-resources` `student-tools` `digital-products` `nextjs` `react` `typescript` `tailwindcss` `mongodb` `google-auth` `cashfree` `razorpay`

## Freebuff

This project includes the `.freebuff/` workspace metadata directory used by Freebuff. Keep it in the project workspace; it is not part of the public website build.

## Development

```bash
npm install
npm run dev
```

The app runs locally at [http://localhost:3000](http://localhost:3000) by default.

## Available scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Environment configuration

Copy `.env.example` to `.env` and provide the required local credentials for MongoDB, Google OAuth, payment providers, and other integrations. Never commit real secrets.

