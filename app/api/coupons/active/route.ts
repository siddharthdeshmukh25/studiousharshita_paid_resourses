import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Coupon from '@/models/Coupon';

/**
 * GET /api/coupons/active — public list of currently active coupons for the
 * home-page offers strip. Only shopper-safe fields are returned; usage counts,
 * category/resource restrictions and everything internal stay server-side.
 */
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: now },
    })
      .sort({ expiresAt: 1 }) // soonest expiry first → most urgent offers shown first
      .limit(3)
      .select('code title description discountType discountPercentage discountAmount expiresAt')
      .lean<{
        _id: unknown;
        code: string;
        title: string;
        description?: string;
        discountType: 'percentage' | 'fixed';
        discountPercentage?: number;
        discountAmount?: number;
        expiresAt?: Date;
      }[]>();

    return NextResponse.json({
      coupons: coupons.map((coupon) => ({
        code: coupon.code,
        title: coupon.title,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountPercentage: coupon.discountPercentage,
        discountAmount: coupon.discountAmount,
        // Serialize the date to ISO so the client countdown is timezone-safe.
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('Active coupons error:', error);
    return NextResponse.json({ coupons: [] });
  }
}
