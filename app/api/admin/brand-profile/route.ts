import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { BrandProfile } from '@/models/BrandProfile';
import { hasAdminSession } from '@/lib/auth/admin';

/** Strip HTML/script tags and cap length — values are rendered as text. */
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';
}

/** Only allow http(s) URLs into social fields (rendered as external hrefs). */
function cleanUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, 500);
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

function cleanPhoto(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, 500);
  // Accept Cloudinary URLs (any host) or local /uploads paths; block javascript: etc.
  return /^(https?:\/\/|\/)/.test(trimmed) ? trimmed : '';
}

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let profile = await BrandProfile.findOne({ key: 'brand' });
    if (!profile) profile = await BrandProfile.create({ key: 'brand' });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return NextResponse.json({ error: 'Failed to fetch brand profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await connectDB();

    const update = {
      isConfigured: true,
      photoUrl: cleanPhoto(body.photoUrl),
      eyebrow: clean(body.eyebrow, 80),
      headline: clean(body.headline, 120),
      tagline: clean(body.tagline, 120),
      bio: clean(body.bio, 1200),
      portraitCaption: clean(body.portraitCaption, 160),
      socials: {
        instagram: cleanUrl(body.socials?.instagram),
        tiktok: cleanUrl(body.socials?.tiktok),
        facebook: cleanUrl(body.socials?.facebook),
        threads: cleanUrl(body.socials?.threads),
        youtube: cleanUrl(body.socials?.youtube),
        pinterest: cleanUrl(body.socials?.pinterest),
        linkedin: cleanUrl(body.socials?.linkedin),
        snapchat: cleanUrl(body.socials?.snapchat),
      },
      emails: {
        support: clean(body.emails?.support, 200),
        contact: clean(body.emails?.contact, 200),
        brand: clean(body.emails?.brand, 200),
      },
      stats: Array.isArray(body.stats)
        ? body.stats.slice(0, 8).map((stat: { value?: unknown; label?: unknown }) => ({
            value: clean(stat?.value, 30),
            label: clean(stat?.label, 60),
          }))
        : [],
    };

    const profile = await BrandProfile.findOneAndUpdate({ key: 'brand' }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json({ error: 'Failed to update brand profile' }, { status: 500 });
  }
}
