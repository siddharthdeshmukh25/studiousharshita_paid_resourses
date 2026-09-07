import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Wishlist from '@/models/Wishlist';
import SupportTicket from '@/models/SupportTicket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('name email image role country ipAddress createdAt purchasedResources').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [orders, wishlistCount, ticketCount] = await Promise.all([
      Order.countDocuments({ userId: user._id }),
      Wishlist.countDocuments({ userId: user._id }),
      SupportTicket.countDocuments({ userId: user._id }),
    ]);

    return NextResponse.json({
      profile: {
        name: user.name,
        email: user.email,
        image: user.image || null,
        role: user.role,
        country: user.country || null,
        ipAddress: user.ipAddress || null,
        createdAt: user.createdAt,
        stats: {
          purchasedCount: user.purchasedResources?.length || 0,
          orderCount: orders,
          wishlistCount,
          ticketCount,
        },
      },
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500 });
  }
}