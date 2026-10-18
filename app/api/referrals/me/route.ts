import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Order from '@/models/Order';
import Referral from '@/models/Referral';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ensureReferralCode, getReferralSettings, resolveCommissionPercent, roundMoney } from '@/lib/referrals';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    await connectDB();
    let referrerId = session.user.id;
    let user = referrerId ? await User.findById(referrerId).select('_id').lean() : null;
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email }).select('_id').lean();
      referrerId = user?._id.toString();
    }
    if (!user || !referrerId) {
      return NextResponse.json({ error: 'Your account could not be found. Please sign in again.' }, { status: 401 });
    }

    const [code, settings] = await Promise.all([ensureReferralCode(referrerId), getReferralSettings()]);
    if (!code) return NextResponse.json({ error: 'Could not create referral code.' }, { status: 500 });

    const resources = await Resource.find({ price: { $gt: 0 }, referralEnabled: { $ne: false } })
      .select('title thumbnailUrl price discount referralEnabled referralPercent')
      .sort({ createdAt: -1 })
      .lean();

    const [clickRows, saleRows] = await Promise.all([
      Referral.aggregate([
        { $match: { referrerId: new mongoose.Types.ObjectId(referrerId), type: 'click' } },
        { $group: { _id: '$resourceId', clicks: { $sum: 1 } } },
      ]),
      Referral.find({ referrerId, type: 'sale' })
        .populate('resourceId', 'title thumbnailUrl')
        .populate('buyerId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const clicksByResource = new Map(clickRows.map((row) => [String(row._id), row.clicks as number]));
    const orderRefs = saleRows.map((sale) => sale.orderRef).filter(Boolean) as string[];
    const buyerIds = saleRows.map((sale) => String((sale.buyerId as unknown as { _id?: unknown } | null)?._id ?? sale.buyerId)).filter((id) => mongoose.isValidObjectId(id));
    const resourceIds = saleRows.map((sale) => String((sale.resourceId as unknown as { _id?: unknown } | null)?._id ?? sale.resourceId)).filter((id) => mongoose.isValidObjectId(id));
    const orders = orderRefs.length
      ? await Order.find({ $or: [{ cashfreeOrderId: { $in: orderRefs } }, { razorpayOrderId: { $in: orderRefs } }] })
          .select('cashfreeOrderId razorpayOrderId userId resourceId status paymentCaptured')
          .lean()
      : [];
    const purchaseOrders = buyerIds.length && resourceIds.length
      ? await Order.find({ userId: { $in: buyerIds }, resourceId: { $in: resourceIds } })
          .select('cashfreeOrderId razorpayOrderId userId resourceId status paymentCaptured')
          .lean()
      : [];
    const getOrderStatus = (order: { status: string; paymentCaptured?: boolean }) =>
      order.status === 'completed' || order.paymentCaptured ? 'earned' : order.status === 'failed' ? 'failed' : 'pending';
    const orderStatus = new Map<string, 'earned' | 'pending' | 'failed'>();
    for (const order of orders) {
      const status = getOrderStatus(order);
      if (order.cashfreeOrderId) orderStatus.set(order.cashfreeOrderId, status);
      if (order.razorpayOrderId) orderStatus.set(order.razorpayOrderId, status);
    }
    const statusPriority = { failed: 0, pending: 1, earned: 2 };
    const purchaseStatus = new Map<string, 'earned' | 'pending' | 'failed'>();
    for (const order of purchaseOrders) {
      const key = `${String(order.userId)}:${String(order.resourceId)}`;
      const status = getOrderStatus(order);
      const previous = purchaseStatus.get(key);
      if (!previous || statusPriority[status] > statusPriority[previous]) purchaseStatus.set(key, status);
    }

    const byResource = new Map<string, { buys: number; earned: number; pending: number }>();
    const sales = saleRows.map((sale) => {
      const resource = sale.resourceId as unknown as { _id?: unknown; title?: string } | null;
      const buyer = sale.buyerId as unknown as { _id?: unknown; name?: string } | null;
      const purchaseKey = `${String(buyer?._id ?? sale.buyerId)}:${String(resource?._id ?? sale.resourceId)}`;
      const status = (sale.orderRef && orderStatus.get(sale.orderRef)) || purchaseStatus.get(purchaseKey) || 'pending';
      const commission = sale.commissionAmount ?? 0;

      const key = String(resource?._id ?? sale.resourceId);
      const entry = byResource.get(key) || { buys: 0, earned: 0, pending: 0 };
      if (status !== 'failed') entry.buys += 1;
      if (status === 'earned') entry.earned += commission;
      if (status === 'pending') entry.pending += commission;
      byResource.set(key, entry);

      return {
        id: String(sale._id),
        resourceTitle: resource?.title || 'Deleted resource',
        buyerName: buyer?.name || 'Buyer',
        saleAmount: sale.saleAmount ?? 0,
        commissionPercent: sale.commissionPercent ?? 0,
        commissionAmount: commission,
        status,
        createdAt: sale.createdAt,
      };
    });

    const totals = sales.reduce(
      (acc, sale) => {
        if (sale.status === 'failed') return acc;
        acc.salesCount += 1;
        if (sale.status === 'earned') acc.earned += sale.commissionAmount;
        if (sale.status === 'pending') acc.pending += sale.commissionAmount;
        return acc;
      },
      { earned: 0, pending: 0, salesCount: 0 }
    );

    const shareableResources = resources
      .map((resource) => ({ resource, commissionPercent: resolveCommissionPercent(resource, settings) }))
      .filter((entry): entry is { resource: (typeof resources)[number]; commissionPercent: number } =>
        entry.commissionPercent !== null && entry.commissionPercent > 0
      );
    const totalClicks = shareableResources.reduce(
      (sum, { resource }) => sum + (clicksByResource.get(String(resource._id)) || 0),
      0
    );
    // Presentation-only preview requested for this account; never write demo activity to MongoDB.
    const demoPreview = session.user.email?.trim().toLowerCase() === 'dsiddharth550@gmail.com'
      ? { clicks: 284, referrals: 56, earned: 6342, firstReferralAt: '2026-01-20T12:00:00.000Z' }
      : null;

    return NextResponse.json({
      demoPreview,
      referralCode: code,
      referralEnabled: settings.enabled,
      defaultPercent: settings.defaultPercent,
      totals: {
        clicks: totalClicks,
        salesCount: totals.salesCount,
        earned: roundMoney(totals.earned),
        pending: roundMoney(totals.pending),
      },
      resources: shareableResources.map(({ resource, commissionPercent }) => {
        const id = String(resource._id);
        const stats = byResource.get(id);
        const discountedPrice = resource.discount && resource.discount > 0
          ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
          : resource.price;
        return {
          id,
          title: resource.title,
          thumbnailUrl: resource.thumbnailUrl || null,
          isFree: false,
          referralEnabled: true,
          commissionPercent,
          estimatedCommission: roundMoney((discountedPrice * commissionPercent) / 100),
          clicks: clicksByResource.get(id) || 0,
          buys: stats?.buys ?? 0,
          earned: roundMoney(stats?.earned ?? 0),
          pending: roundMoney(stats?.pending ?? 0),
        };
      }),
      sales,
    });
  } catch (error) {
    console.error('Referral dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load referral data.' }, { status: 500 });
  }
}
