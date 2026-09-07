import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ read: false }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to load notifications.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    await connectDB();
    await Notification.updateOne({ _id: body.id }, { read: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to update notification.' }, { status: 500 });
  }
}