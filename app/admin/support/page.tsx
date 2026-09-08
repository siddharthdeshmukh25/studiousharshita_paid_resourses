'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LifeBuoy,
  Loader2,
  Search,
  X,
  Send,
  ShieldCheck,
  User,
  MessageSquare,
  BadgeCheck,
  Clock,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface TicketUser {
  _id: string;
  name: string;
  email: string;
}

interface Message {
  author: 'user' | 'admin';
  text: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  source: 'support' | 'contact';
  orderId?: string;
  userId: TicketUser;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  message: string;
}

interface OrderContext {
  orderId: string;
  razorpayOrderId?: string;
  amount: number;
  status: string;
  gateway?: string;
  captureStatus?: string;
  captureFailureReason?: string;
  resource?: { _id: string; title: string; price: number };
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high'];

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  resolved: { label: 'Resolved', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

function AdminSupportPageContent() {
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: Ticket; orderContext: OrderContext | null; hasAccess: boolean } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/support?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, search]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/support/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load ticket');
      setDetail(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadTickets(), 0);
    return () => clearTimeout(timer);
  }, [loadTickets]);

  // Open a specific ticket from URL (?ticket=ID) e.g. from notifications
  useEffect(() => {
    const ticketId = searchParams.get('ticket');
    if (ticketId) {
      const timer = setTimeout(() => {
        setSelectedId(ticketId);
        loadDetail(ticketId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadDetail]);

  const openTicket = (id: string) => {
    setSelectedId(id);
    loadDetail(id);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setReply('');
    setActionError(null);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/support/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reply');
      setReply('');
      setDetail(data);
      loadTickets();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedId) return;
    setActionError(null);
    try {
      const response = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');
      setDetail(data);
      loadTickets();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const grantAccess = async () => {
    if (!detail || !detail.orderContext?.resource) return;
    const userId = (detail.ticket.userId as TicketUser)._id?.toString();
    const resourceId = detail.orderContext.resource._id;
    if (!userId || !resourceId) return;

    setGranting(true);
    setActionError(null);
    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceId, orderId: detail.orderContext.orderId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to grant access');
      await updateStatus('resolved');
      if (selectedId) loadDetail(selectedId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const statusChips = (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {['all', ...STATUS_OPTIONS].map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={`px-2 py-1 rounded-md text-xs sm:px-3.5 sm:py-1.5 sm:rounded-lg sm:text-sm font-medium border transition-colors ${
            statusFilter === s
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 dark:bg-[#0d1413] dark:text-gray-300 dark:border-gray-700'
          }`}
        >
          {s === 'all' ? 'All' : STATUS_META[s].label}
        </button>
      ))}
    </div>
  );

  const sourceTabs = (
    <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
      {(['all', 'support', 'contact'] as const).map((s) => (
        <button
          key={s}
          onClick={() => setSourceFilter(s)}
          className={`px-2.5 py-1 rounded-md text-xs sm:px-3 sm:py-1.5 sm:text-sm font-medium transition-colors ${
            sourceFilter === s
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {s === 'all' ? 'All' : s === 'support' ? 'Support' : 'Contact'}
        </button>
      ))}
    </div>
  );

  const allMessages = detail
    ? [
        { author: 'user' as const, text: detail.ticket.message, createdAt: detail.ticket.createdAt },
        ...(detail.ticket.messages || []),
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">
              Customer Care
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-[-.045em] text-gray-900 dark:text-gray-100">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Resolve payment, access and refund queries from your customers.
            </p>
          </div>
          <div className="hidden sm:grid h-12 w-12 place-items-center rounded-xl bg-blue-600/10">
            <LifeBuoy className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {statusChips}
          <div className="flex flex-wrap items-center gap-3">
            {sourceTabs}
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-[#0d1413] dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Ticket list */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#080d0d]">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-5 sm:py-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">No tickets found.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {tickets.map((ticket) => {
                const meta = STATUS_META[ticket.status] || STATUS_META.open;
                const user = ticket.userId as TicketUser;
                return (
                  <button
                    key={ticket._id}
                    onClick={() => openTicket(ticket._id)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#0d1413] sm:gap-4 sm:px-5 sm:py-4 ${
                      selectedId === ticket._id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                        {ticket.source === 'contact' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Contact
                          </span>
                        )}
                        {ticket.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            High priority
                          </span>
                        )}
                        <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{ticket.category}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.name || user?.email || 'Unknown user'} ·{' '}
                        {ticket.orderId ? `Order ${ticket.orderId}` : 'No order ID'} ·{' '}
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Detail modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 admin-mobile-modal">
          <div className="admin-modal-card max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#080d0d] sm:max-w-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-700 dark:bg-[#0a0e0e]">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {detail?.ticket.subject || 'Loading ticket…'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {detail ? `${detail.ticket.userId?.name || 'Unknown'} · ${new Date(detail.ticket.createdAt).toLocaleString('en-IN')}` : ''}
                </p>
              </div>
              <button onClick={closeDetail} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" /></div>
            ) : detail ? (
              <div className="p-6 space-y-6">
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={detail.ticket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-[#0d1413] dark:text-gray-100"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                  <select
                    value={detail.ticket.priority}
                    onChange={async (e) => {
                      try {
                        const response = await fetch('/api/admin/support', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ticketId: selectedId, priority: e.target.value }),
                        });
                        const data = await response.json();
                        if (response.ok) setDetail(data);
                      } catch { /* ignore */ }
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-[#0d1413] dark:text-gray-100"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p} className="capitalize">{p} priority</option>
                    ))}
                  </select>
                </div>

                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {actionError}
                  </div>
                )}

                {/* Order context */}
                {detail.orderContext && (
                  <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      <BadgeCheck className="h-4 w-4 text-blue-600" />
                      Order context
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div><dt className="text-gray-500 dark:text-gray-400">Order ID</dt><dd className="font-mono text-xs text-gray-900 dark:text-gray-100 mt-0.5 break-all">{detail.orderContext.orderId}</dd></div>
                      {detail.orderContext.resource && (
                        <div><dt className="text-gray-500 dark:text-gray-400">Resource</dt><dd className="text-gray-900 dark:text-gray-100 mt-0.5">{detail.orderContext.resource.title}</dd></div>
                      )}
                      <div><dt className="text-gray-500 dark:text-gray-400">Amount</dt><dd className="text-gray-900 dark:text-gray-100 mt-0.5">₹{detail.orderContext.amount.toFixed(2)}</dd></div>
                      <div><dt className="text-gray-500 dark:text-gray-400">Gateway / status</dt><dd className="text-gray-900 dark:text-gray-100 mt-0.5">{detail.orderContext.gateway || '—'} · {detail.orderContext.status}</dd></div>
                      {detail.orderContext.captureFailureReason && (
                        <div className="col-span-2"><dt className="text-gray-500 dark:text-gray-400">Capture issue</dt><dd className="text-red-600 dark:text-red-400 mt-0.5">{detail.orderContext.captureFailureReason}</dd></div>
                      )}
                    </dl>

                    {!detail.hasAccess && detail.orderContext.resource && (
                      <button
                        onClick={grantAccess}
                        disabled={granting}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Grant access manually
                      </button>
                    )}
                    {detail.hasAccess && (
                      <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <CheckCircle2 className="h-4 w-4" />
                        User already has access
                      </p>
                    )}
                  </div>
                )}

                {/* Conversation */}
                <div className="space-y-4">
                  {allMessages.map((msg, index) => {
                    const isUser = msg.author === 'user';
                    return (
                      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${isUser
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-[#0d1413] dark:text-gray-100'
                        }`}>
                          <div className={`flex items-center gap-2 mb-2 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {isUser ? <User className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              {isUser ? detail.ticket.userId?.name || 'Customer' : 'You'}
                            </span>
                            <span className="text-xs opacity-80">
                              {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply */}
                <form onSubmit={sendReply} className="space-y-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to the customer…"
                    rows={3}
                    maxLength={5000}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-[#0d1413] dark:text-gray-100 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending || !reply.trim() || detail.ticket.status === 'closed'}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send reply
                    </button>
                  </div>
                  {detail.ticket.status === 'closed' && (
                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3.5 w-3.5" /> This ticket is closed. Change its status to reply.
                    </p>
                  )}
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-white dark:bg-[#0a0a0a]" />}>
      <AdminSupportPageContent />
    </Suspense>
  );
}