# Freebuff run doc (preview setup)

## Reproduce uncommitted artifacts

1. `.env` — required (MongoDB URI, NextAuth, Cashfree/Razorpay, Cloudinary, Google OAuth/Drive credentials). If missing, copy it from the main checkout (`D:\official project\resourses_seller_platform\.env`). Never commit it; `.gitignore` already excludes it.
2. Dependencies — `node_modules` must exist. Install with `npm ci` (package-lock.json present) or `npm install`.

## Run the server

- `npm run dev -- -p 3000` from the project root (the `-p 3000` pin keeps the server on 3000 so it matches `NEXTAUTH_URL`; without it the Next.js 16 dev server auto-picks another free port if 3000 is taken/blocked — observed on 55003, 56319 and 58557).
- `.env` sets `NEXTAUTH_URL=http://localhost:3000`; if the server ever lands on a different port, Google sign-in callbacks will point at 3000 — adjust `NEXTAUTH_URL` to match the actual port for auth flows.
- Health check: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` (or chosen port) → expect `200`.
- Security note: `CRON_SECRET` is not set in `.env`; the `/api/cron/payment-capture-retry` endpoint returns 500 until it is configured. The webhook endpoints fail closed (500) until payment webhook secrets are configured in Admin → Settings.
- The route-protection file is `proxy.ts` (Next.js 16 renamed the `middleware.ts` convention; a `middleware.ts` file would trigger a deprecation warning).