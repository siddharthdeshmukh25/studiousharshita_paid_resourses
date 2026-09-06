'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, Users, Globe2, MousePointer2, MapPin } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import KPICard from '@/components/admin/KPICard';

type Stats = { totalUsers: number };
type Metric = { totalOpens: number; uniqueUsers: number; buyers: number };
type Daily = { day: string; eventType: string; count: number };
type Country = { country: string; events: number; users: number };
type Breakdown = { label: string; value: number };
type Analytics = { metrics: Record<string, Metric>; dailyActivity: Daily[]; countries: Country[]; devices: Breakdown[]; sources: Breakdown[] };
type LocationData = {
  countryStats: { country: string; userCount: number }[];
  totalUsers: number;
  actionStats: { action: string; count: number }[];
  recentActivity: any[];
  countryAnalytics: { country: string; count: number }[];
};

const formatDay = (day: string) => new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(new Date(`${day}T00:00:00`));
const label = (value: string) => value.replaceAll('_', ' ');

function LineGraph({ data }: { data: { label: string; views: number; actions: number }[] }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.views, item.actions]));
  const points = (key: 'views' | 'actions') => data.map((item, index) => `${(index / Math.max(1, data.length - 1)) * 100},${92 - (item[key] / max) * 72}`).join(' ');
  return (
    <div className="h-[245px] pt-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[205px] w-full overflow-visible">
        <defs>
          <linearGradient id="analyticsFill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#b8ff00" stopOpacity=".24"/>
            <stop offset="1" stopColor="#b8ff00" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[20, 44, 68, 92].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth=".35" />
        ))}
        <polygon points={`0,92 ${points('views')} 100,92`} fill="url(#analyticsFill)"/>
        <polyline points={points('views')} fill="none" stroke="#b8ff00" strokeWidth="1.35" vectorEffect="non-scaling-stroke"/>
        <polyline points={points('actions')} fill="none" stroke="#76a9fa" strokeWidth="1.15" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"/>
        {data.map((item, index) => (
          <circle key={`${item.label}-${index}`} cx={(index / Math.max(1, data.length - 1)) * 100} cy={92 - (item.views / max) * 72} r="1.3" fill="#b8ff00" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between text-[11px] text-slate-400">
        {data.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
      </div>
    </div>
  );
}

function WorldMap({ countries, locationData }: { countries: Country[]; locationData?: LocationData }) {
  const countryMap: Record<string, [number, number]> = {
    'IN': [72, 45], // India
    'US': [25, 36], // USA
    'GB': [45, 31], // UK
    'DE': [52, 38], // Germany
    'AU': [82, 75], // Australia
    'CA': [25, 25], // Canada
    'BR': [36, 65], // Brazil
    'JP': [85, 35], // Japan
    'FR': [48, 35], // France
    'RU': [65, 25], // Russia
  };
  
  const max = Math.max(1, ...countries.map((item) => item.events), ...(locationData?.countryStats.map((item) => item.userCount) || [1]));
  
  // Combine existing countries with location data
  const allCountries = locationData?.countryStats.map((item) => ({
    country: item.country,
    events: item.userCount,
    users: item.userCount,
  })) || countries;
  
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
      <svg viewBox="0 0 1000 470" className="h-[270px] w-full" aria-label="World visitor map">
        <g fill="none" stroke="currentColor" className="text-slate-300 dark:text-white/15" strokeWidth="2">
          <path d="M75 96l112-41 83 23 15 61-54 35-37 82-72 2-30-67-55-31z"/>
          <path d="M257 278l67 22 38 87-26 68-40-13-11-63-46-53z"/>
          <path d="M426 89l85-34 83 31 15 58-52 25-51-16-53 49-63-23 10-54z"/>
          <path d="M518 202l88-22 81 56-25 126-68 57-61-72z"/>
          <path d="M654 128l133-35 114 45-4 89-78 25-52-38-87 11z"/>
          <path d="M810 266l94 7 33 61-44 49-89-32z"/>
        </g>
        {allCountries.slice(0, 10).map((country, index) => {
          const coords = countryMap[country.country];
          if (!coords) return null;
          const [x, y] = coords;
          const size = 6 + (country.events / max) * 12;
          return (
            <g key={country.country}>
              <circle cx={`${x}%`} cy={`${y}%`} r={size} fill="#b8ff00" fillOpacity=".18"/>
              <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="#b8ff00"/>
              <title>{country.country}: {country.users || country.events} users</title>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="h-2 w-2 rounded-full bg-[#b8ff00]" />
        User activity by country
      </div>
    </div>
  );
}

function BreakdownBars({ title, data }: { title: string; data: Breakdown[] }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <section className="rounded-xl border border-slate-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="font-semibold capitalize text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="mt-5 space-y-4">
        {data.slice(0, 5).map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="capitalize text-slate-600 dark:text-slate-300">{label(item.label)}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {!data.length && <p className="text-sm text-slate-500 dark:text-slate-400">No tracked data yet.</p>}
      </div>
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [locationData, setLocationData] = useState<LocationData | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/resources/analytics'),
      fetch('/api/admin/analytics')
    ])
      .then(async ([statsResponse, analyticsResponse, locationResponse]) => {
        if (!statsResponse.ok || !analyticsResponse.ok) throw new Error();
        setStats(await statsResponse.json());
        setAnalytics(await analyticsResponse.json());
        
        if (locationResponse.ok) {
          const locationResult = await locationResponse.json();
          if (locationResult.success) {
            setLocationData(locationResult.data);
          }
        }
      })
      .catch(() => setError('Analytics could not be loaded. Please refresh and try again.'));
  }, []);

  const chart = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    return days.map((day) => {
      const items = analytics?.dailyActivity.filter((item) => item.day === day) || [];
      return {
        label: formatDay(day),
        views: items.filter((item) => item.eventType === 'page_view').reduce((sum, item) => sum + item.count, 0),
        actions: items.filter((item) => item.eventType !== 'page_view').reduce((sum, item) => sum + item.count, 0)
      };
    });
  }, [analytics]);

  const today = chart.at(-1);
  const yesterday = chart.at(-2);
  const totals = Object.values(analytics?.metrics || {}).reduce((sum, item) => ({
    opens: sum.opens + item.totalOpens,
    buyers: sum.buyers + item.buyers
  }), { opens: 0, buyers: 0 });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-green-600 dark:text-green-400">Performance</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Daily store engagement, conversion signals and visitor geography.</p>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KPICard title="Today page views" value={today?.views ?? 0} icon={<Eye className="h-5 w-5" />} />
              <KPICard title="Yesterday views" value={yesterday?.views ?? 0} icon={<MousePointer2 className="h-5 w-5" />} />
              <KPICard title="Resource opens" value={totals.opens} icon={<BarChart3 className="h-5 w-5" />} />
              <KPICard title="Registered users" value={stats?.totalUsers ?? '—'} icon={<Users className="h-5 w-5" />} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Engagement trend</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last 14 days · page views and customer actions</p>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2 w-2 rounded-full bg-green-500" />
                    Page views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-0.5 w-3 bg-blue-400" />
                    Actions
                  </span>
                </div>
              </div>
              <LineGraph data={chart} />
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
              <section className="rounded-xl border border-slate-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Geography</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Countries with most visitors</p>
                  </div>
                  <Globe2 className="h-5 w-5 text-slate-400" />
                </div>
                <WorldMap countries={analytics?.countries || []} locationData={locationData} />
              </section>

              <div className="grid gap-5">
                <BreakdownBars title="Devices" data={analytics?.devices || []} />
                <BreakdownBars title="Traffic sources" data={analytics?.sources || []} />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}