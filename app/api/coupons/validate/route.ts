import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getValidCoupon } from '@/lib/coupons';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json() as { code?: string };
    if (!code?.trim()) return NextResponse.json({ error: 'Enter a coupon code.' }, { status: 400 });

    await connectDB();
    const coupon = await getValidCoupon(code);
    if (!coupon) return NextResponse.json({ error: 'This coupon is invalid or has expired.' }, { status: 400 });

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountPercentage: coupon.discountPercentage,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Could not validate this coupon.' }, { status: 500 });
  }
}
