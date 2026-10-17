import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { ensureReferralCode } from '@/lib/referrals';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    // Resolve the authenticated account from the session. Prefer the stable
    // database id, but fall back to the verified session email if an older JWT
    // contains an id that no longer maps to a user document.
    await connectDB();
    let user = session.user.id
      ? await User.findById(session.user.id).select('_id').lean()
      : null;
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email }).select('_id').lean();
    }
    if (!user) {
      return NextResponse.json({ error: 'Your account could not be found. Please sign in again.' }, { status: 401 });
    }

    const referralCode = await ensureReferralCode(user._id.toString());
    if (!referralCode) {
      return NextResponse.json({ error: 'Could not create referral code.' }, { status: 500 });
    }

    return NextResponse.json({ referralCode }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Referral code error:', error);
    return NextResponse.json({ error: 'Could not load referral link.' }, { status: 500 });
  }
}
