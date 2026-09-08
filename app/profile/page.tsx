'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
  X,
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
  thumbnailUrl: string;
  category: string;
  purchasedAt: string;
}

interface WishlistItem {
  _id: string;
  resourceId:
    | {
        _id: string;
        title: string;
        thumbnailUrl: string;
        price: number;
        discount?: number;
        category: string;
      }
    | string;
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

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
  { id: 'resources', label: 'My Resources', icon: <Package className="h-4 w-4" /> },
  { id: 'watchlist', label: 'Watchlist', icon: <Heart className="h-4 w-4" /> },
  { id: 'orders', label: 'Orders', icon: <Receipt className="h-4 w-4" /> },
  { id: 'tickets', label: 'Support Tickets', icon: <LifeBuoy className="h-4 w-4" /> },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-[var(--accent-soft-2)] text-[var(--accent-text)]' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800' },
  resolved: { label: 'Resolved', className: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700' },
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-100">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-base text-gray-600 mb-6">Login to view your resources, orders and support tickets.</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/profile' })}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
            >
              Login to continue
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Account</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-base text-gray-600">
              Manage your resources, watchlist, orders and support tickets.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Sidebar / tab nav */}
            <aside className="lg:col-span-1">
              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex lg:flex-col items-center lg:items-start gap-4">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-16 w-16 lg:h-20 lg:w-20 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-16 w-16 lg:h-20 lg:w-20 place-items-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.name || session.user?.name}</h2>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{profile?.email || session.user?.email}</span>
                    </p>
                    {profile?.country && (
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.country}
                      </p>
                    )}
                    {profile?.createdAt && (
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab nav — vertical on desktop, horizontal chips on mobile */}
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : (
                <>
                  {/* Overview */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: 'Purchased', value: profile?.stats.purchasedCount ?? 0, icon: <Package className="h-5 w-5" /> },
                          { label: 'Orders', value: profile?.stats.orderCount ?? 0, icon: <Receipt className="h-5 w-5" /> },
                          { label: 'Wishlist', value: profile?.stats.wishlistCount ?? 0, icon: <Heart className="h-5 w-5" /> },
                          { label: 'Tickets', value: profile?.stats.ticketCount ?? 0, icon: <LifeBuoy className="h-5 w-5" /> },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-gray-600">{stat.label}</span>
                              <span className="text-blue-600">{stat.icon}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                          Account details
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base">
                          <div>
                            <dt className="text-sm text-gray-500">Full name</dt>
                            <dd className="font-medium text-gray-900 mt-0.5">{profile?.name || session.user?.name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Email</dt>
                            <dd className="font-medium text-gray-900 mt-0.5">{profile?.email || session.user?.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Account type</dt>
                            <dd className="font-medium text-gray-900 mt-0.5 capitalize">{profile?.role === 'admin' ? 'Administrator' : 'Customer'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Country</dt>
                            <dd className="font-medium text-gray-900 mt-0.5">{profile?.country || '—'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* My Resources */}
                  {activeTab === 'resources' && (
                    <div>
                      {resources.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No purchased resources yet</h3>
                          <p className="text-sm text-gray-600 mb-5">Browse our collection and unlock your first resource.</p>
                          <button
                            onClick={() => router.push('/')}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Browse resources
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {resources.map((resource) => (
                            <div key={resource._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                              <div className="h-40 overflow-hidden">
                                <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-5">
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {resource.category}
                                </span>
                                <h4 className="mt-2 text-base font-semibold text-gray-900 line-clamp-1">{resource.title}</h4>
                                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Purchased on {new Date(resource.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                <button
                                  onClick={() => openResource(resource._id)}
                                  className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open Resource
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Watchlist */}
                  {activeTab === 'watchlist' && (
                    <div>
                      {wishlist.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Your watchlist is empty</h3>
                          <p className="text-sm text-gray-600 mb-5">Save resources you like and find them here later.</p>
                          <button
                            onClick={() => router.push('/')}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Browse resources
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {wishlist.map((item) => {
                            const id = typeof item.resourceId === 'string' ? item.resourceId : item.resourceId._id;
                            const title = typeof item.resourceId === 'string' ? 'Resource' : item.resourceId.title;
                            const thumb = typeof item.resourceId === 'string' ? undefined : item.resourceId.thumbnailUrl;
                            const category = typeof item.resourceId === 'string' ? '' : item.resourceId.category;
                            return (
                              <div key={item._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="h-40 overflow-hidden">
                                  <img src={thumb || '/placeholder.png'} alt={title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-5">
                                  <span className="inline-block px-2 py-0.5 bg-[var(--accent-soft-2)] text-[var(--accent-text)] rounded-full text-xs font-medium">
                                    {category || 'Resource'}
                                  </span>
                                  <h4 className="mt-2 text-base font-semibold text-gray-900 line-clamp-1">{title}</h4>
                                  <div className="mt-4 flex gap-2">
                                    <button
                                      onClick={() => router.push(`/resource/${id}`)}
                                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => removeFromWishlist(id)}
                                      className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
                                      title="Remove from wishlist"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
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
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
                          <p className="text-sm text-gray-600">Your purchase history will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.map((order) => {
                            const meta = STATUS_META[order.status] || STATUS_META.pending;
                            return (
                              <div key={order._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                                        {order.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : order.status === 'failed' ? <Circle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                        {meta.label}
                                      </span>
                                      <span className="text-xs font-mono text-gray-500">{order.orderId}</span>
                                    </div>
                                    <h4 className="mt-2 text-base font-semibold text-gray-900">{order.resource?.title || 'Resource'}</h4>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.gateway || 'manual'} · {order.paymentCaptured ? 'Payment captured' : order.captureStatus || '—'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">₹{order.amount.toFixed(2)}</p>
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Your tickets</h3>
                        <button
                          onClick={() => router.push('/support')}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          + Open a ticket
                        </button>
                      </div>
                      {tickets.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                          <LifeBuoy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No support tickets</h3>
                          <p className="text-sm text-gray-600">Need help with a payment or access issue? Create a ticket.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tickets.map((ticket) => {
                            const meta = TICKET_STATUS[ticket.status] || TICKET_STATUS.open;
                            return (
                              <button
                                key={ticket._id}
                                onClick={() => router.push(`/support/${ticket._id}`)}
                                className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-5 transition-colors hover:border-blue-400"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                                        {meta.label}
                                      </span>
                                      <span className="text-xs capitalize text-gray-500">{ticket.category}</span>
                                      {ticket.orderId && <span className="text-xs font-mono text-gray-500">#{ticket.orderId}</span>}
                                    </div>
                                    <h4 className="text-base font-semibold text-gray-900">{ticket.subject}</h4>
                                  </div>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
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