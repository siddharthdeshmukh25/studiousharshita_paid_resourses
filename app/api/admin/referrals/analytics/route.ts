import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { hasAdminSession } from '@/lib/auth/admin';
import Referral from '@/models/Referral';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  if (!(await hasAdminSession(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const referrals = await Referral.find()
      .populate('referrerId', 'name email referralCode')
      .populate('buyerId', 'name email')
      .populate('resourceId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const orderRefs = referrals.filter((item) => item.type === 'sale').map((item) => item.orderRef).filter(Boolean) as string[];
    const orders = orderRefs.length
      ? await Order.find({ cashfreeOrderId: { $in: orderRefs } }).select('cashfreeOrderId status paymentCaptured').lean()
      : [];
    const orderStatus = new Map(orders.map((order) => [
      order.cashfreeOrderId,
      order.status === 'completed' || order.paymentCaptured ? 'earned' : order.status === 'failed' ? 'failed' : 'pending',
    ]));

    const grouped = new Map<string, {
      referrer: { name: string; email: string; code: string };
      clicks: number;
      sales: number;
      earned: number;
      pending: number;
    }>();
    const sales: Array<{
      id: string;
      referrerName: string;
      referrerEmail: string;
      buyerName: string;
      buyerEmail: string;
      resourceTitle: string;
      saleAmount: number;
      commissionPercent: number;
      commissionAmount: number;
      status: 'earned' | 'pending' | 'failed';
      createdAt: Date;
    }> = [];

    for (const item of referrals) {
      const referrer = item.referrerId as unknown as { _id: mongoose.Types.ObjectId; name?: string; email?: string; referralCode?: string } | null;
      if (!referrer?._id) continue;
      const key = String(referrer._id);
      const summary = grouped.get(key) || {
        referrer: { name: referrer.name || 'User', email: referrer.email || '', code: referrer.referralCode || '' },
        clicks: 0,
        sales: 0,
        earned: 0,
        pending: 0,
      };

      if (item.type === 'click') {
        summary.clicks += 1;
      } else {
        const status = (item.orderRef && orderStatus.get(item.orderRef)) || 'pending';
        const buyer = item.buyerId as unknown as { name?: string; email?: string } | null;
        const resource = item.resourceId as unknown as { title?: string } | null;
        if (status !== 'failed') summary.sales += 1;
        if (status === 'earned') summary.earned += item.commissionAmount || 0;
        if (status === 'pending') summary.pending += item.commissionAmount || 0;
        sales.push({
          id: String(item._id),
          referrerName: summary.referrer.name,
          referrerEmail: summary.referrer.email,
          buyerName: buyer?.name || 'Buyer',
          buyerEmail: buyer?.email || '',
          resourceTitle: resource?.title || 'Deleted resource',
          saleAmount: item.saleAmount || 0,
          commissionPercent: item.commissionPercent || 0,
          commissionAmount: item.commissionAmount || 0,
          status: status as 'earned' | 'pending' | 'failed',
          createdAt: item.createdAt,
        });
      }
      grouped.set(key, summary);
    }

    const referrers = Array.from(grouped.values()).map(({ referrer, clicks, sales: salesCount, earned, pending }) => ({
      ...referrer,
      clicks,
      sales: salesCount,
      earned: Math.round(earned * 100) / 100,
      pending: Math.round(pending * 100) / 100,
    })).sort((a, b) => b.earned + b.pending - (a.earned + a.pending));

    return NextResponse.json({
      totals: {
        clicks: referrers.reduce((sum, item) => sum + item.clicks, 0),
        sales: referrers.reduce((sum, item) => sum + item.sales, 0),
        earned: Math.round(referrers.reduce((sum, item) => sum + item.earned, 0) * 100) / 100,
        pending: Math.round(referrers.reduce((sum, item) => sum + item.pending, 0) * 100) / 100,
      },
      referrers,
      sales: sales.slice(0, 200),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin referral analytics error:', error);
    return NextResponse.json({ error: 'Failed to load referral analytics.' }, { status: 500 });
  }
}
