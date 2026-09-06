import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Search users by email (case-insensitive partial match)
    const users = await User.find({
      email: { $regex: email, $options: 'i' }
    }).select('_id email name').limit(10);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
