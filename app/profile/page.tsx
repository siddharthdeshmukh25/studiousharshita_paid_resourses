'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceCard from '@/components/resource/ResourceCard';
import { countryName } from '@/lib/countries';
import { formatPrice } from '@/lib/format';
import {
  User,
  Package,
  Heart,
  Receipt,
  LifeBuoy,
  Loader2,
  ExternalLink,
  Calendar,
  MapPin,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Circle,
  LogOut,
  BadgeCheck,
  Star,
} from 'lucide-react';

interface Profile {
  name: string;
  email: string;
  image: string | null;
  role: string;
  country: string | null;
  createdAt: string;
  stats: {
    purchasedCount: number;
    orderCount: number;
    wishlistCount: number;
    ticketCount: number;
  };
}

interface PurchasedResource {
  _id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
  thumbnailUrl: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
  purchasedAt: string;
}

interface WishlistResource {
  _id: string;
  title: string;
  thumbnailUrl: string;
  price: number;
  discount?: number;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

interface WishlistItem {
  _id: string;
  resourceId: WishlistResource | string;
}

interface Order {
  _id: string;
  orderId: string;
  resource: { _id: string; title: string; thumbnailUrl: string; price: number } | null;
  amount: number;
  status: string;
  gateway: string | null;
  paymentCaptured: boolean;
  captureStatus: string | null;
  createdAt: string;
}

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  orderId?: string;
  createdAt: string;
}

type Tab = 'overview' | 'resources' | 'watchlist' | 'orders' | 'tickets';

const TABS: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: <User className="h-4 w-4" /> },
  { id: 'resources', label: 'My Resources', shortLabel: 'Resources', icon: <Package className="h-4 w-4" /> },
  { id: 'watchlist', label: 'Watchlist', shortLabel: 'Watchlist', icon: <Heart className="h-4 w-4" /> },
  { id: 'orders', label: 'Orders', shortLabel: 'Orders', icon: <Receipt className="h-4 w-4" /> },
  { id: 'tickets', label: 'Support Tickets', shortLabel: 'Tickets', icon: <LifeBuoy className="h-4 w-4" /> },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-[var(--accent-soft)] text-[var(--accent-deep)]' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-[var(--accent-soft-2)] text-[var(--accent-text)]' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800' },
  resolved: { label: 'Resolved', className: 'bg-[var(--accent-soft)] text-[var(--accent-deep)]' },
  closed: { label: 'Closed', className: 'bg-[var(--accent-soft)] text-[#4A443B]' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resources, setResources] = useState<PurchasedResource[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, resourcesRes, wishlistRes, ordersRes, ticketsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/purchased-resources'),
        fetch('/api/wishlist'),
        fetch('/api/user/orders'),
        fetch('/api/support'),
      ]);

      const profileData = await profileRes.json();
      const resourcesData = await resourcesRes.json();
      const wishlistData = await wishlistRes.json();
      const ordersData = await ordersRes.json();
      const ticketsData = await ticketsRes.json();

      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to load profile');
      setProfile(profileData.profile);
      setResources(resourcesData.resources || []);
      setWishlist(wishlistData.wishlist || []);
      setOrders(ordersData.orders || []);
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(() => fetchAll(), 0);
      return () => clearTimeout(timer);
    }
  }, [status, fetchAll]);

  const openResource = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/resources/${resourceId}/open-drive`);
      const data = await response.json();
      if (response.ok && data.driveUrl) window.open(data.driveUrl, '_blank');
      else alert(data.error || 'Failed to open resource');
    } catch {
      alert('Failed to open resource');
    }
  };

  const tabCount = (id: Tab): number | null => {
    if (id === 'resources') return resources.length;
    if (id === 'watchlist') return wishlist.length;
    if (id === 'orders') return orders.length;
    if (id === 'tickets') return tickets.length;
    return null;
  };

  const removeFromWishlist = async (resourceId: string) => {
    try {
      await fetch(`/api/wishlist?resourceId=${resourceId}`, { method: 'DELETE' });
      setWishlist((prev) => prev.filter((item) => {
        const id = typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id;
        return id !== resourceId;
      }));
    } catch {
      /* ignore */
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <div className="flex-1 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#A29785]" /></div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-soft)]">
              <User className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">My Profile</h1>
            <p className="text-base text-[#6B6257] mb-6">Login to view your resources, orders and support tickets.</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/profile' })}
              className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-[var(--accent-deep)] transition-colors"
            >
              Login to continue
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading — desktop only; mobile leads with the identity card */}
          <div className="hidden lg:block mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Account</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-[#1A1A1A]">My Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-5 lg:gap-7 items-start">
            {/* Left column — identity card + desktop nav */}
            <aside className="lg:sticky lg:top-24">
              {/* Profile card */}
              <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm p-4 sm:p-5 mb-4 lg:mb-5">
                <div className="flex lg:flex-col items-center lg:items-start gap-4">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-16 w-16 lg:h-20 lg:w-20 rounded-full object-cover ring-2 ring-[var(--accent-soft-2)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-16 w-16 lg:h-20 lg:w-20 place-items-center rounded-full bg-[var(--accent)] text-2xl font-bold text-white">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 lg:mt-2">
                    <h2 className="text-lg font-bold text-[#1A1A1A] truncate">{profile?.name || session.user?.name}</h2>
                    <p className="text-sm text-[#6B6257] flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{profile?.email || session.user?.email}</span>
                    </p>
                    <div className="lg:flex lg:items-center lg:gap-3 lg:mt-2">
                      {profile?.country && (
                        <p className="text-xs lg:text-sm text-[#6B6257] flex items-center gap-1.5 mt-1 lg:mt-0">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {countryName(profile.country)}
                        </p>
                      )}
                      {profile?.createdAt && (
                        <p className="text-xs lg:text-sm text-[#6B6257] flex items-center gap-1.5 mt-1 lg:mt-0">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="mt-4 hidden lg:inline-flex items-center gap-1.5 border-t border-[var(--line)] pt-3 w-full text-sm font-semibold text-[#6B6257] hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>

              {/* Desktop vertical nav with counts */}
              <nav className="hidden lg:flex flex-col gap-1.5">
                {TABS.map((tab) => {
                  const count = tabCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[var(--accent)] text-white shadow-sm'
                          : 'bg-[#FFFDF8] text-[#4A443B] border border-[var(--line)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {count !== null && count > 0 && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--accent-soft-2)] text-[var(--accent-deep)]'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Right column — mobile nav + content */}
            <div className="min-w-0">
              {/* Mobile horizontal pill nav */}
              <nav className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((tab) => {
                  const count = tabCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[#FFFDF8] text-[#4A443B] border border-[var(--line)]'
                      }`}
                    >
                      {tab.icon}
                      {tab.shortLabel}
                      {count !== null && count > 0 && (
                        <span className={`rounded-full px-1.5 text-[11px] font-bold ${
                          activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--accent-soft-2)] text-[var(--accent-deep)]'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
              )}
              {loading ? (
                <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] p-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#A29785] mx-auto" />
                </div>
              ) : (
                <>
                  {/* Overview */}
                  {activeTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {([
                          { label: 'Purchased', value: profile?.stats.purchasedCount ?? 0, icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />, tab: 'resources' as Tab },
                          { label: 'Orders', value: profile?.stats.orderCount ?? 0, icon: <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />, tab: 'orders' as Tab },
                          { label: 'Wishlist', value: profile?.stats.wishlistCount ?? 0, icon: <Heart className="h-4 w-4 sm:h-5 sm:w-5" />, tab: 'watchlist' as Tab },
                          { label: 'Tickets', value: profile?.stats.ticketCount ?? 0, icon: <LifeBuoy className="h-4 w-4 sm:h-5 sm:w-5" />, tab: 'tickets' as Tab },
                        ]).map((stat) => (
                          <button
                            key={stat.label}
                            onClick={() => setActiveTab(stat.tab)}
                            className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm p-4 sm:p-5 text-left transition-colors hover:border-[var(--accent)]"
                          >
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <span className="text-xs sm:text-sm text-[#6B6257]">{stat.label}</span>
                              <span className="text-[var(--accent)]">{stat.icon}</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">{stat.value}</p>
                          </button>
                        ))}
                      </div>

                      <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                          Account details
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 text-sm sm:text-base">
                          <div>
                            <dt className="text-xs sm:text-sm text-[#6B6257]">Full name</dt>
                            <dd className="font-medium text-[#1A1A1A] mt-0.5">{profile?.name || session.user?.name}</dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm text-[#6B6257]">Email</dt>
                            <dd className="font-medium text-[#1A1A1A] mt-0.5 break-all">{profile?.email || session.user?.email}</dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm text-[#6B6257]">Account type</dt>
                            <dd className="font-medium text-[#1A1A1A] mt-0.5">{profile?.role === 'admin' ? 'Administrator' : 'Customer'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm text-[#6B6257]">Country</dt>
                            <dd className="font-medium text-[#1A1A1A] mt-0.5">{countryName(profile?.country) || '—'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* My Resources */}
                  {activeTab === 'resources' && (
                    <div>
                      {resources.length === 0 ? (
                        <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] p-10 sm:p-12 text-center">
                          <Package className="h-12 w-12 text-[#D8CFC0] mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">No purchased resources yet</h3>
                          <p className="text-sm text-[#6B6257] mb-5">Browse our collection and unlock your first resource.</p>
                          <button
                            onClick={() => router.push('/resources')}
                            className="bg-[var(--accent)] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[var(--accent-deep)] transition-colors"
                          >
                            Browse resources
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                          {resources.map((resource) => {
                            const cover = resource.images && resource.images.length > 0 ? resource.images[0] : resource.thumbnailUrl;
                            const hasRating = (resource.avgRating ?? 0) > 0 && (resource.totalReviews ?? 0) > 0;
                            return (
                              <div key={resource._id} className="group bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                                {/* Polaroid cover with owned badge */}
                                <div className="relative aspect-[16/9] overflow-hidden bg-[var(--accent-soft)]">
                                  <img
                                    src={cover}
                                    alt={resource.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                                    <BadgeCheck className="h-3 w-3" />
                                    Purchased
                                  </span>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                  <span className="self-start px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent-deep)] rounded-full text-[10px] font-bold uppercase tracking-wide">
                                    {resource.category}
                                  </span>
                                  <h4 className="mt-2 text-[15px] font-semibold text-[#1A1A1A] line-clamp-1">{resource.title}</h4>
                                  {hasRating && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <span className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(resource.avgRating!) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--line)]'}`} />
                                        ))}
                                      </span>
                                      <span className="text-[11px] font-semibold text-[#6B6257]">
                                        {resource.avgRating!.toFixed(1)}
                                        <span className="font-normal"> ({resource.totalReviews})</span>
                                      </span>
                                    </div>
                                  )}
                                  <p className="mt-1 text-xs text-[#6B6257] flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    Purchased {new Date(resource.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                  <button
                                    onClick={() => openResource(resource._id)}
                                    className="mt-3 sm:mt-auto w-full bg-[var(--accent)] text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent-deep)] transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Resource
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Watchlist */}
                  {activeTab === 'watchlist' && (
                    <div>
                      {wishlist.length === 0 ? (
                        <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] p-10 sm:p-12 text-center">
                          <Heart className="h-12 w-12 text-[#D8CFC0] mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">Your watchlist is empty</h3>
                          <p className="text-sm text-[#6B6257] mb-5">Save resources you like and find them here later.</p>
                          <button
                            onClick={() => router.push('/resources')}
                            className="bg-[var(--accent)] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[var(--accent-deep)] transition-colors"
                          >
                            Browse resources
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 min-[600px]:grid-cols-3 gap-2.5 sm:gap-3">
                          {wishlist.map((item) => {
                            if (typeof item.resourceId === 'string') {
                              return (
                                <div key={item._id} className="rounded-xl border border-[var(--line)] bg-[#FFFDF8] p-4 text-sm text-[#6B6257]">
                                  Saved resource
                                  <button onClick={() => removeFromWishlist(item.resourceId as string)} className="mt-2 block text-xs font-semibold text-red-500 hover:underline">
                                    Remove
                                  </button>
                                </div>
                              );
                            }
                            const r = item.resourceId;
                            return (
                              <ResourceCard
                                key={item._id}
                                id={r._id}
                                title={r.title}
                                rating={r.avgRating || 0}
                                reviewCount={r.totalReviews || 0}
                                price={r.price}
                                discount={r.discount}
                                thumbnailUrl={r.thumbnailUrl}
                                category={r.category}
                                onGetResource={() => router.push(`/resource/${r._id}`)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders */}
                  {activeTab === 'orders' && (
                    <div>
                      {orders.length === 0 ? (
                        <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] p-12 text-center">
                          <Receipt className="h-12 w-12 text-[#D8CFC0] mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">No orders yet</h3>
                          <p className="text-sm text-[#6B6257]">Your purchase history will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.map((order) => {
                            const meta = STATUS_META[order.status] || STATUS_META.pending;
                            return (
                              <div key={order._id} className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                                        {order.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : order.status === 'failed' ? <Circle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                        {meta.label}
                                      </span>
                                      <span className="text-xs font-mono text-[#6B6257]">{order.orderId}</span>
                                    </div>
                                    <h4 className="mt-2 text-[15px] font-semibold text-[#1A1A1A]">{order.resource?.title || 'Resource'}</h4>
                                    <p className="mt-1 text-xs sm:text-sm text-[#6B6257]">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.gateway || 'manual'} · {order.paymentCaptured ? 'Payment captured' : order.captureStatus || '—'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-[#1A1A1A]">{formatPrice(order.amount)}</p>
                                    {order.resource && (
                                      <button
                                        onClick={() => router.push(`/resource/${order.resource!._id}`)}
                                        className="mt-1 text-sm text-[var(--accent)] hover:underline font-medium"
                                      >
                                        View resource
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Support tickets */}
                  {activeTab === 'tickets' && (
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A]">Your tickets</h3>
                        <button
                          onClick={() => router.push('/support')}
                          className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-deep)]"
                        >
                          + Open a ticket
                        </button>
                      </div>
                      {tickets.length === 0 ? (
                        <div className="bg-[#FFFDF8] rounded-2xl border border-[var(--line)] p-12 text-center">
                          <LifeBuoy className="h-12 w-12 text-[#D8CFC0] mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">No support tickets</h3>
                          <p className="text-sm text-[#6B6257]">Need help with a payment or access issue? Create a ticket.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tickets.map((ticket) => {
                            const meta = TICKET_STATUS[ticket.status] || TICKET_STATUS.open;
                            return (
                              <button
                                key={ticket._id}
                                onClick={() => router.push(`/support/${ticket._id}`)}
                                className="w-full text-left bg-[#FFFDF8] rounded-2xl border border-[var(--line)] shadow-sm p-4 sm:p-5 transition-colors hover:border-[var(--accent)]"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                                        {meta.label}
                                      </span>
                                      <span className="text-xs capitalize text-[#6B6257]">{ticket.category}</span>
                                      {ticket.orderId && <span className="text-xs font-mono text-[#6B6257]">#{ticket.orderId}</span>}
                                    </div>
                                    <h4 className="text-[15px] font-semibold text-[#1A1A1A]">{ticket.subject}</h4>
                                  </div>
                                  <span className="text-xs text-[#6B6257] flex-shrink-0">
                                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}