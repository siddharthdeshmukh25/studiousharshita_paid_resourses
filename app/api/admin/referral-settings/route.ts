import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import { SiteSettings } from '@/models/SiteSettings';
import { getReferralSettings } from '@/lib/referrals';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const secretValue = process.env.ADMIN_JWT_SECRET;
  if (!token || !secretValue) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secretValue));
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [settings, resources] = await Promise.all([
      getReferralSettings(),
      Resource.find().select('title price referralEnabled referralPercent').sort({ price: 1, createdAt: -1 }).lean(),
    ]);
    return NextResponse.json({
      settings,
      resources: resources.map((resource) => ({
        id: String(resource._id),
        title: resource.title,
        price: resource.price,
        isFree: resource.price === 0,
        referralEnabled: resource.referralEnabled !== false,
        referralPercent: resource.referralPercent ?? null,
      })),
    });
  } catch (error) {
    console.error('Get referral settings error:', error);
    return NextResponse.json({ error: 'Failed to load referral settings.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      enabled?: boolean;
      defaultPercent?: number;
      resources?: { id: string; referralEnabled: boolean; referralPercent: number | null }[];
    };

    const defaultPercent = Number(body.defaultPercent);
    if (body.defaultPercent !== undefined && (!Number.isFinite(defaultPercent) || defaultPercent < 0 || defaultPercent > 100)) {
      return NextResponse.json({ error: 'Default commission must be between 0% and 100%.' }, { status: 400 });
    }

    await connectDB();
    await SiteSettings.updateOne(
      { key: 'site' },
      {
        $set: {
          ...(body.enabled !== undefined ? { 'referral.enabled': Boolean(body.enabled) } : {}),
          ...(body.defaultPercent !== undefined ? { 'referral.defaultPercent': defaultPercent } : {}),
        },
      },
      { upsert: true }
    );

    const normalizedResources = (body.resources || []).map((item) => ({
      ...item,
      percent: item.referralPercent === null || item.referralPercent === undefined ? null : Number(item.referralPercent),
    }));
    if (normalizedResources.some(({ percent }) => percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100))) {
      return NextResponse.json({ error: 'Per-resource commission must be between 0% and 100%.' }, { status: 400 });
    }

    for (const item of normalizedResources) {
      if (!item?.id) continue;
      await Resource.updateOne(
        { _id: item.id },
        { $set: { referralEnabled: Boolean(item.referralEnabled), referralPercent: item.percent } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update referral settings error:', error);
    return NextResponse.json({ error: 'Failed to save referral settings.' }, { status: 500 });
  }
}
