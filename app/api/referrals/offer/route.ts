import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getResourceCommission } from '@/lib/referrals';

export async function GET(request: NextRequest) {
  const resourceId = new URL(request.url).searchParams.get('resourceId');
  if (!resourceId || !mongoose.isValidObjectId(resourceId)) {
    return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
  }

  try {
    const commissionPercent = await getResourceCommission(resourceId);
    return NextResponse.json({ commissionPercent: commissionPercent ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Referral offer error:', error);
    return NextResponse.json({ error: 'Could not load referral offer.' }, { status: 500 });
  }
}
