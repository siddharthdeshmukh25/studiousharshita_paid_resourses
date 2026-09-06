import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import UserAnalytics from '@/models/UserAnalytics';

/**
 * Admin API endpoint for analytics data
 * Returns country-wise user statistics
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get country-wise user count
    const countryStats = await User.aggregate([
      {
        $match: {
          country: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get analytics by action type
    const actionStats = await UserAnalytics.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get recent analytics entries
    const recentActivity = await UserAnalytics.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get country-wise analytics count
    const countryAnalytics = await UserAnalytics.aggregate([
      {
        $match: {
          country: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        countryStats: countryStats.map((stat) => ({
          country: stat._id,
          userCount: stat.count,
        })),
        totalUsers,
        actionStats: actionStats.map((stat) => ({
          action: stat._id,
          count: stat.count,
        })),
        recentActivity,
        countryAnalytics: countryAnalytics.map((stat) => ({
          country: stat._id,
          count: stat.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
