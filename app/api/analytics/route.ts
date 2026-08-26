import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ResourceAnalytics from '@/models/ResourceAnalytics';
import Resource from '@/models/Resource';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to check if user is admin/manager
async function isAdmin(session: any) {
  if (!session?.user?.email) return false;
  // Add your admin email check logic here
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(session.user.email);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Build base query
    const baseQuery: any = {
      timestamp: { $gte: startDate, $lte: now }
    };

    if (resourceId) {
      baseQuery.resourceId = new mongoose.Types.ObjectId(resourceId);
    }

    // Get all analytics data
    const analyticsData = await ResourceAnalytics.find(baseQuery)
      .sort({ timestamp: -1 })
      .limit(limit * 10); // Get more data for aggregation

    // Aggregate comprehensive stats
    const stats = {
      overview: {
        totalPageViews: analyticsData.filter(a => a.eventType === 'page_view').length,
        totalClicks: analyticsData.filter(a => a.eventType === 'click').length,
        totalShares: analyticsData.filter(a => a.eventType === 'share').length,
        totalPurchases: analyticsData.filter(a => a.eventType === 'purchase').length,
        uniqueVisitors: new Set(analyticsData.map(a => a.sessionId)).size,
        avgTimeOnPage: 0
      },
      trafficSources: {} as Record<string, number>,
      deviceTypes: {} as Record<string, number>,
      socialPlatforms: {} as Record<string, number>,
      locations: {} as Record<string, number>,
      conversionFunnel: {
        pageViews: 0,
        clicks: 0,
        purchases: 0,
        conversionRate: '0.00'
      },
      topResources: [] as any[],
      recentActivity: [] as any[],
      hourlyDistribution: [] as { hour: number; count: number }[],
      dailyTrends: [] as { date: string; views: number; purchases: number }[]
    };

    // Calculate traffic sources
    analyticsData.forEach(record => {
      const source = record.trafficSource;
      stats.trafficSources[source] = (stats.trafficSources[source] || 0) + 1;
    });

    // Calculate device types
    analyticsData.forEach(record => {
      const device = record.deviceType;
      stats.deviceTypes[device] = (stats.deviceTypes[device] || 0) + 1;
    });

    // Calculate social platforms
    analyticsData.forEach(record => {
      if (record.socialPlatform) {
        const platform = record.socialPlatform;
        stats.socialPlatforms[platform] = (stats.socialPlatforms[platform] || 0) + 1;
      }
    });

    // Calculate locations
    analyticsData.forEach(record => {
      if (record.location?.country) {
        const country = record.location.country;
        stats.locations[country] = (stats.locations[country] || 0) + 1;
      }
    });

    // Calculate conversion funnel
    stats.conversionFunnel.pageViews = stats.overview.totalPageViews;
    stats.conversionFunnel.clicks = stats.overview.totalClicks;
    stats.conversionFunnel.purchases = stats.overview.totalPurchases;
    stats.conversionFunnel.conversionRate = stats.overview.totalPageViews > 0 
      ? ((stats.overview.totalPurchases / stats.overview.totalPageViews) * 100).toFixed(2)
      : '0.00';

    // Calculate average time on page
    const timeOnPageRecords = analyticsData.filter(a => a.eventType === 'time_on_page' && a.timeOnPage);
    if (timeOnPageRecords.length > 0) {
      const totalTime = timeOnPageRecords.reduce((sum, record) => sum + (record.timeOnPage || 0), 0);
      stats.overview.avgTimeOnPage = Math.round(totalTime / timeOnPageRecords.length);
    }

    // Get top resources
    if (!resourceId) {
      const resourceStats = new Map<string, { views: number; purchases: number; title: string }>();
      
      for (const record of analyticsData) {
        const resId = record.resourceId.toString();
        if (!resourceStats.has(resId)) {
          const resource = await Resource.findById(record.resourceId);
          resourceStats.set(resId, { views: 0, purchases: 0, title: resource?.title || 'Unknown' });
        }
        
        const stat = resourceStats.get(resId)!;
        if (record.eventType === 'page_view') stat.views++;
        if (record.eventType === 'purchase') stat.purchases++;
      }
      
      stats.topResources = Array.from(resourceStats.entries())
        .map(([id, data]) => ({ resourceId: id, ...data }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
    }

    // Get recent activity
    stats.recentActivity = analyticsData.slice(0, 20).map(record => ({
      eventType: record.eventType,
      trafficSource: record.trafficSource,
      deviceType: record.deviceType,
      timestamp: record.timestamp,
      resourceId: record.resourceId.toString()
    }));

    // Calculate hourly distribution
    const hourlyCounts = new Array(24).fill(0);
    analyticsData.forEach(record => {
      const hour = new Date(record.timestamp).getHours();
      hourlyCounts[hour]++;
    });
    stats.hourlyDistribution = hourlyCounts.map((count, hour) => ({ hour, count }));

    // Calculate daily trends
    const dailyCounts = new Map<string, { views: number; purchases: number }>();
    analyticsData.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!dailyCounts.has(date)) {
        dailyCounts.set(date, { views: 0, purchases: 0 });
      }
      
      const dayData = dailyCounts.get(date)!;
      if (record.eventType === 'page_view') dayData.views++;
      if (record.eventType === 'purchase') dayData.purchases++;
    });
    
    stats.dailyTrends = Array.from(dailyCounts.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
