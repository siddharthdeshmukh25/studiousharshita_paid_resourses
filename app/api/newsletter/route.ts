import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Subscriber from '@/models/Subscriber';

/**
 * POST /api/newsletter — store a newsletter signup. Validated, rate limited
 * per IP, and duplicate-safe (repeat emails just get a friendly confirmation).
 */

// In-memory rate limit: max 5 attempts per IP per 10 minutes. Good enough to
// stop drive-by spam on a single small endpoint.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const entry = attempts.get(ip);

    if (entry && entry.resetAt > now) {
      entry.count += 1;
      if (entry.count > MAX_ATTEMPTS) {
        return NextResponse.json({ message: 'Too many attempts. Please try again a little later.' }, { status: 429 });
      }
    } else {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    const body = (await request.json().catch(() => null)) as { email?: string; source?: string } | null;
    const email = body?.email?.trim().toLowerCase();
    // Where the signup came from (lead magnet, footer…) — analytics only.
    const source = body?.source?.trim().slice(0, 60) || undefined;

    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    await connectDB();
    await Subscriber.updateOne({ email }, { $setOnInsert: { email, source } }, { upsert: true });

    return NextResponse.json(
      { message: 'You are in! Useful resources are on their way to your inbox. ♡' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription failed:', error);
    return NextResponse.json({ message: 'Could not subscribe right now. Please try again.' }, { status: 500 });
  }
}
