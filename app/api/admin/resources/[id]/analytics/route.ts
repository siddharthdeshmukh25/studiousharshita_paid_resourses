import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import ResourceAccessLog from '@/models/ResourceAccessLog';
import Order from '@/models/Order';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!token || !secret) return false;
  try { await jwtVerify(token, new TextEncoder().encode(secret)); return true; } catch { return false; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const { id } = await params;
    const resource = await Resource.findById(id).select('title price');
    if (!resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });

    const [accesses, orders] = await Promise.all([
      ResourceAccessLog.aggregate([
        { $match: { resourceId: resource._id } },
        { $group: { _id: '$userId', opens: { $sum: 1 }, firstOpenedAt: { $min: '$openedAt' }, lastOpenedAt: { $max: '$openedAt' }, sources: { $addToSet: '$source' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', opens: 1, firstOpenedAt: 1, lastOpenedAt: 1, sources: 1 } },
        { $sort: { lastOpenedAt: -1 } },
      ]),
      Order.find({ resourceId: resource._id, $or: [{ status: 'completed' }, { paymentCaptured: true }] }).sort({ createdAt: -1 }).populate('userId', 'name email').lean(),
    ]);
    const buyersById = new Map<string, { _id: string; name?: string; email?: string; purchasedAt: Date; amount: number }>();
    orders.forEach((order: any) => {
      const user = order.userId as { _id?: { toString(): string }; name?: string; email?: string };
      if (user?._id) buyersById.set(user._id.toString(), { _id: user._id.toString(), name: user.name, email: user.email, purchasedAt: order.createdAt, amount: order.amount });
    });
    const buyers = Array.from(buyersById.values());
    const accessUserIds = new Set(accesses.map((item) => item.userId.toString()));
    return NextResponse.json({
      resource: { title: resource.title, isFree: resource.price === 0 },
      summary: { totalOpens: accesses.reduce((sum, item) => sum + item.opens, 0), uniqueUsers: accesses.length, buyers: buyers.length, buyersWhoOpened: buyers.filter((user) => accessUserIds.has(user._id)).length },
      accesses,
      buyers: resource.price === 0 ? [] : buyers,
    });
  } catch (error) {
    console.error('Resource analytics detail error:', error);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
