import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import ResourceAccessLog from '@/models/ResourceAccessLog';
import Order from '@/models/Order';

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
    const [opens, buyers] = await Promise.all([
      ResourceAccessLog.aggregate([
        { $group: { _id: '$resourceId', totalOpens: { $sum: 1 }, users: { $addToSet: '$userId' } } },
        { $project: { totalOpens: 1, uniqueUsers: { $size: '$users' } } },
      ]),
      Order.aggregate([
        { $match: { $or: [{ status: 'completed' }, { paymentCaptured: true }] } },
        { $group: { _id: '$resourceId', buyers: { $addToSet: '$userId' } } },
        { $project: { buyers: { $size: '$buyers' } } },
      ]),
    ]);

    const metrics: Record<string, { totalOpens: number; uniqueUsers: number; buyers: number }> = {};
    opens.forEach((item) => { metrics[item._id.toString()] = { totalOpens: item.totalOpens, uniqueUsers: item.uniqueUsers, buyers: 0 }; });
    buyers.forEach((item) => {
      const id = item._id.toString();
      metrics[id] = { totalOpens: metrics[id]?.totalOpens || 0, uniqueUsers: metrics[id]?.uniqueUsers || 0, buyers: item.buyers };
    });
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Resource analytics summary error:', error);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
