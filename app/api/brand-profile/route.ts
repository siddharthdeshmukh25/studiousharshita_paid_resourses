import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { BrandProfile } from '@/models/BrandProfile';

// Edited at runtime from /admin/profile — never cache (Next 16 would otherwise
// keep serving the pre-edit response).
export const dynamic = 'force-dynamic';

/**
 * Public brand-profile endpoint.
 * Returns the stored document (possibly a fresh default one) — the client
 * merges it over lib/site.ts defaults, so this can safely return sparse data.
 */
export async function GET() {
  try {
    await connectDB();
    let profile = await BrandProfile.findOne({ key: 'brand' }).lean();
    if (!profile) {
      await BrandProfile.create({ key: 'brand' });
      profile = await BrandProfile.findOne({ key: 'brand' }).lean();
    }
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Fail-safe: an unreachable DB must never break the homepage — the client
    // falls back to lib/site.ts defaults.
    return NextResponse.json({ profile: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
