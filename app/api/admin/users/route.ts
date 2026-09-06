import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import ResourceAnalytics from '@/models/ResourceAnalytics';
import ResourceAccessLog from '@/models/ResourceAccessLog';
import UserActivity from '@/models/UserActivity';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!token || !secret) return false;
  try { await jwtVerify(token, new TextEncoder().encode(secret)); return true; } catch { return false; }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const id = new URL(request.url).searchParams.get('id');
    if (id && !mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

    if (id) {
      const user = await User.findById(id).select('name email image role purchasedResources createdAt country ipAddress').lean();
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const userId = new mongoose.Types.ObjectId(id);
      const [orders, analytics, accessLogs, visits] = await Promise.all([
        Order.find({ userId, $or: [{ status: 'completed' }, { paymentCaptured: true }] }).populate('resourceId', 'title').sort({ createdAt: -1 }).lean(),
        ResourceAnalytics.find({ visitorId: userId }).populate('resourceId', 'title').sort({ timestamp: -1 }).limit(80).lean(),
        ResourceAccessLog.find({ userId }).populate('resourceId', 'title').sort({ openedAt: -1 }).limit(80).lean(),
        UserActivity.find({ userId }).sort({ timestamp: -1 }).limit(80).lean(),
      ]);
      const [visitCounts, accessCounts] = await Promise.all([
        UserActivity.aggregate([{ $match: { userId } }, { $group: { _id: '$userId', visits: { $sum: 1 }, lastVisit: { $max: '$timestamp' } } }]),
        ResourceAccessLog.aggregate([{ $match: { userId } }, { $group: { _id: '$userId', opens: { $sum: 1 } } }]),
      ]);
      const visitData = visitCounts[0] || { visits: 0, lastVisit: null };
      const accessData = accessCounts[0] || { opens: 0 };
      const timeline = [
        ...analytics.map((item) => ({ id: item._id.toString(), type: item.eventType, label: `${item.eventType.replaceAll('_', ' ')} on ${(item.resourceId as unknown as { title?: string })?.title || 'a resource'}`, timestamp: item.timestamp, meta: item.deviceType })),
        ...accessLogs.map((item) => ({ id: item._id.toString(), type: 'resource_open', label: `opened ${(item.resourceId as unknown as { title?: string })?.title || 'a resource'}`, timestamp: item.openedAt, meta: item.source || 'direct' })),
        ...visits.map((item) => ({ id: item._id.toString(), type: 'page_view', label: `visited ${item.path}`, timestamp: item.timestamp, meta: 'website' })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 120);
      return NextResponse.json({ 
        user: { ...user, visits: visitData.visits, lastVisit: visitData.lastVisit, resourceOpens: accessData.opens }, 
        orders, 
        timeline, 
        summary: { visits: visits.length, interactions: analytics.length, resourceOpens: accessLogs.length, totalSpent: orders.reduce((sum, order) => sum + order.amount, 0) } 
      });
    }

    const query = new URL(request.url).searchParams.get('q')?.trim();
    const filter = query ? { $or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }] } : {};
    const users = await User.find(filter).select('name email image role createdAt country ipAddress').sort({ createdAt: -1 }).limit(100).lean();
    const ids = users.map((user) => user._id);
    const [visitCounts, accessCounts] = await Promise.all([
      UserActivity.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', visits: { $sum: 1 }, lastVisit: { $max: '$timestamp' } } }]),
      ResourceAccessLog.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', opens: { $sum: 1 } } }]),
    ]);
    const visitsByUser = new Map(visitCounts.map((item) => [item._id.toString(), item]));
    const opensByUser = new Map(accessCounts.map((item) => [item._id.toString(), item.opens]));
    return NextResponse.json({ users: users.map((user) => ({ ...user, visits: visitsByUser.get(user._id.toString())?.visits || 0, lastVisit: visitsByUser.get(user._id.toString())?.lastVisit || null, resourceOpens: opensByUser.get(user._id.toString()) || 0 })) });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
