import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import ResourceAccessLog from '@/models/ResourceAccessLog';
import Order from '@/models/Order';
import ResourceAnalytics from '@/models/ResourceAnalytics';

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
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const [opens, buyers, dailyActivity, countries, devices, sources] = await Promise.all([
      ResourceAccessLog.aggregate([
        { $group: { _id: '$resourceId', totalOpens: { $sum: 1 }, users: { $addToSet: '$userId' } } },
        { $project: { totalOpens: 1, uniqueUsers: { $size: '$users' } } },
      ]),
      Order.aggregate([
        { $match: { $or: [{ status: 'completed' }, { paymentCaptured: true }] } },
        { $group: { _id: '$resourceId', buyers: { $addToSet: '$userId' } } },
        { $project: { buyers: { $size: '$buyers' } } },
      ]),
      ResourceAnalytics.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, eventType: '$eventType' }, count: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
        { $project: { _id: 0, day: '$_id.day', eventType: '$_id.eventType', count: 1, uniqueVisitors: { $size: { $filter: { input: '$visitors', as: 'visitor', cond: { $ne: ['$$visitor', null] } } } } } },
        { $sort: { day: 1 } },
      ]),
      ResourceAnalytics.aggregate([
        { $match: { 'location.country': { $exists: true, $ne: '' } } },
        { $group: { _id: '$location.country', events: { $sum: 1 }, visitors: { $addToSet: '$visitorId' }, lastSeen: { $max: '$timestamp' } } },
        { $project: { _id: 0, country: '$_id', events: 1, users: { $size: { $filter: { input: '$visitors', as: 'visitor', cond: { $ne: ['$$visitor', null] } } } }, lastSeen: 1 } },
        { $sort: { events: -1 } }, { $limit: 20 },
      ]),
      ResourceAnalytics.aggregate([{ $group: { _id: '$deviceType', value: { $sum: 1 } } }, { $project: { _id: 0, label: '$_id', value: 1 } }, { $sort: { value: -1 } }]),
      ResourceAnalytics.aggregate([{ $group: { _id: '$trafficSource', value: { $sum: 1 } } }, { $project: { _id: 0, label: '$_id', value: 1 } }, { $sort: { value: -1 } }]),
    ]);

    const metrics: Record<string, { totalOpens: number; uniqueUsers: number; buyers: number }> = {};
    opens.forEach((item) => { metrics[item._id.toString()] = { totalOpens: item.totalOpens, uniqueUsers: item.uniqueUsers, buyers: 0 }; });
    buyers.forEach((item) => {
      const id = item._id.toString();
      metrics[id] = { totalOpens: metrics[id]?.totalOpens || 0, uniqueUsers: metrics[id]?.uniqueUsers || 0, buyers: item.buyers };
    });
    return NextResponse.json({ metrics, dailyActivity, countries, devices, sources });
  } catch (error) {
    console.error('Resource analytics summary error:', error);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
