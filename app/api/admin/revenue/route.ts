import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';

async function requireAdmin(request: NextRequest) { const token = request.cookies.get('admin_token')?.value; const secret = process.env.ADMIN_JWT_SECRET; if (!token || !secret) return false; try { await jwtVerify(token, new TextEncoder().encode(secret)); return true; } catch { return false; } }

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const paid: any = { $or: [{ status: 'completed' }, { paymentCaptured: true }] };
    const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0);
    const [orders, totals, daily] = await Promise.all([
      Order.find(paid).populate('userId', 'name email').populate('resourceId', 'title').sort({ createdAt: -1 }).limit(100).lean(),
      Order.aggregate([{ $match: paid }, { $group: { _id: null, revenue: { $sum: '$amount' }, orders: { $sum: 1 }, average: { $avg: '$amount' } } }]),
      Order.aggregate([{ $match: { ...paid, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, orders: { $sum: 1 } } }, { $project: { _id: 0, day: '$_id', revenue: 1, orders: 1 } }, { $sort: { day: 1 } }]),
    ]);
    return NextResponse.json({ summary: totals[0] || { revenue: 0, orders: 0, average: 0 }, orders, daily });
  } catch { return NextResponse.json({ error: 'Failed to load revenue.' }, { status: 500 }); }
}
