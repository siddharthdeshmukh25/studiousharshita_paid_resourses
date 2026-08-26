'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Eye, 
  MousePointer2, 
  Share2, 
  ShoppingCart, 
  Clock,
  Smartphone,
  Monitor,
  Globe,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalPageViews: number;
    totalClicks: number;
    totalShares: number;
    totalPurchases: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
  };
  trafficSources: Record<string, number>;
  deviceTypes: Record<string, number>;
  socialPlatforms: Record<string, number>;
  locations: Record<string, number>;
  conversionFunnel: {
    pageViews: number;
    clicks: number;
    purchases: number;
    conversionRate: string;
  };
  topResources: Array<{
    resourceId: string;
    title: string;
    views: number;
    purchases: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    trafficSource: string;
    deviceType: string;
    timestamp: Date;
    resourceId: string;
  }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyTrends: Array<{ date: string; views: number; purchases: number }>;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          period: selectedPeriod,
          ...(selectedResource && { resourceId: selectedResource })
        });

        const response = await fetch(`/api/analytics?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch analytics');
        }

        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, selectedPeriod, selectedResource, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive resource tracking and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="Page Views"
            value={formatNumber(analytics.overview.totalPageViews)}
            color="blue"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Unique Visitors"
            value={formatNumber(analytics.overview.uniqueVisitors)}
            color="green"
          />
          <StatCard
            icon={<MousePointer2 className="h-5 w-5" />}
            label="Clicks"
            value={formatNumber(analytics.overview.totalClicks)}
            color="purple"
          />
          <StatCard
            icon={<Share2 className="h-5 w-5" />}
            label="Shares"
            value={formatNumber(analytics.overview.totalShares)}
            color="pink"
          />
          <StatCard
            icon={<ShoppingCart className="h-5 w-5" />}
            label="Purchases"
            value={formatNumber(analytics.overview.totalPurchases)}
            color="orange"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Avg Time"
            value={formatTime(analytics.overview.avgTimeOnPage)}
            color="indigo"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Traffic Sources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Traffic Sources
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.trafficSources).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-green-600" />
              Device Types
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.deviceTypes).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{device}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Platforms */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-600" />
              Social Platforms
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.socialPlatforms).length > 0 ? (
                Object.entries(analytics.socialPlatforms).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{platform}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No social media traffic yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Conversion Funnel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Page Views</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(analytics.conversionFunnel.pageViews)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Clicks</p>
              <p className="text-2xl font-bold text-purple-900">{formatNumber(analytics.conversionFunnel.clicks)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Purchases</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.conversionFunnel.purchases)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-orange-900">{analytics.conversionFunnel.conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Top Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Top Performing Resources
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Resource</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Views</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Purchases</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topResources.map((resource) => (
                  <tr key={resource.resourceId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{resource.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatNumber(resource.views)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatNumber(resource.purchases)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {resource.views > 0 ? ((resource.purchases / resource.views) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                    {activity.eventType.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600 capitalize">{activity.trafficSource.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-500 capitalize">{activity.deviceType}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            Daily Trends
          </h3>
          <div className="h-64 flex items-end gap-1">
            {analytics.dailyTrends.slice(-30).map((trend, index) => {
              const maxViews = Math.max(...analytics.dailyTrends.map(t => t.views));
              const height = (trend.views / maxViews) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      <div>Views: {trend.views}</div>
                      <div>Purchases: {trend.purchases}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-left">
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${colorClasses[color]?.split(' ')[0]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
