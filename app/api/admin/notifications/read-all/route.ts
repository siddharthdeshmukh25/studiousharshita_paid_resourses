import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import { hasAdminSession } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await Notification.updateMany({ read: false }, { read: true });
    return NextResponse.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Failed to update notifications.' }, { status: 500 });
  }
}