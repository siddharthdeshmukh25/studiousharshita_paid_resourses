import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Referral from '@/models/Referral';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, getReferralSettings } from '@/lib/referrals';

export async function POST(request: NextRequest) {
  try {
    const { code, resourceId } = await request.json() as { code?: string; resourceId?: string };
    const normalizedCode = code?.trim();
    if (!normalizedCode || !resourceId || !mongoose.isValidObjectId(resourceId)) {
      return NextResponse.json({ error: 'Referral code and resource are required.' }, { status: 400 });
    }

    await connectDB();
    const [referrer, resource] = await Promise.all([
      User.findOne({ referralCode: normalizedCode }).select('_id').lean(),
      Resource.findById(resourceId).select('_id referralEnabled').lean(),
    ]);
    if (!referrer || !resource) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Keep the referral attribution cookie for both free and paid destinations;
    // count clicks for any resource while the site referral program is active.
    const settings = await getReferralSettings();
    const session = await getServerSession(authOptions);
    const visitorId = session?.user?.id;
    const isSelfVisit = visitorId && String(referrer._id) === visitorId;
    const resourceReferralsEnabled = resource.referralEnabled !== false;
    if (settings.enabled && resourceReferralsEnabled && !isSelfVisit) {
      await Referral.create({
        referrerId: referrer._id,
        resourceId: resource._id,
        type: 'click',
      });
    }

    const response = NextResponse.json({ success: true, tracked: settings.enabled && resourceReferralsEnabled && !isSelfVisit });
    response.cookies.set(REFERRAL_COOKIE, normalizedCode, {
      path: '/',
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
    });
    return response;
  } catch (error) {
    console.error('Referral track error:', error);
    return NextResponse.json({ error: 'Could not record referral.' }, { status: 500 });
  }
}
