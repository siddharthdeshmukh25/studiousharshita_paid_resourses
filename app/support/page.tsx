'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  LifeBuoy,
  MessageSquarePlus,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Send,
} from 'lucide-react';

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  source: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  messages?: { author: string; text: string; createdAt: string }[];
}

const CATEGORIES = [
  { value: 'payment', label: 'Payment issue' },
  { value: 'access', label: 'Access / download problem' },
  { value: 'refund', label: 'Refund request' },
  { value: 'project', label: 'Student project' },
  { value: 'general', label: 'General question' },
];

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  open: { label: 'Open', className: 'bg-[var(--accent-soft-2)] text-[var(--accent-text)]', icon: <Circle className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3.5 w-3.5" /> },
  resolved: { label: 'Resolved', className: 'bg-blue-100 text-blue-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700', icon: <Circle className="h-3.5 w-3.5" /> },
};

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('payment');
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') return;
    if (status !== 'authenticated') return;

    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/support');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load tickets');
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!subject.trim()) {
      setFormError('Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      setFormError('Please describe your issue.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, orderId: orderId.trim() || undefined, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create ticket');

      setSuccess('Your ticket has been submitted. Our team will reply within 24-48 hours.');
      setSubject('');
      setMessage('');
      setOrderId('');

      // Refresh list
      const listResponse = await fetch('/api/support');
      const listData = await listResponse.json();
      if (listResponse.ok) setTickets(listData.tickets || []);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
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
              <LifeBuoy className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Center</h1>
            <p className="text-base text-gray-600 mb-6">
              Login to raise a support ticket and track your payment, access or refund issues.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/support' })}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
            >
              Login to continue
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Support Center</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <LifeBuoy className="h-7 w-7 text-blue-600" />
              How can we help?
            </h1>
            <p className="mt-1 text-base text-gray-600">
              Payment failed or can&apos;t access a resource? Create a ticket and we&apos;ll sort it out.
            </p>
          </div>

          {/* Create ticket */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <MessageSquarePlus className="h-5 w-5 text-blue-600" />
              Open a new ticket
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Include your order ID if your issue is related to a payment or purchase.
            </p>

            {formError && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{formError}</div>
            )}
            {success && (
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="ticket-subject" className="block text-sm font-semibold text-gray-900 mb-2">
                  Subject
                </label>
                <input
                  id="ticket-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  maxLength={200}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="ticket-category" className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
                  </label>
                  <select
                    id="ticket-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ticket-order" className="block text-sm font-semibold text-gray-900 mb-2">
                    Order ID <span className="font-normal text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="ticket-order"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. razorpay_1727..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ticket-message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Describe your issue
                </label>
                <textarea
                  id="ticket-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what happened. If your payment failed, mention the error you saw and any transaction reference."
                  maxLength={5000}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Submit ticket
                </button>
              </div>
            </form>
          </section>

          {/* My tickets */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My tickets</h2>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-red-600">{error}</div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <p className="text-base text-gray-600">You have no support tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const meta = STATUS_META[ticket.status] || STATUS_META.open;
                  const lastMessage = ticket.messages?.[ticket.messages.length - 1];
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => router.push(`/support/${ticket._id}`)}
                      className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-5 transition-colors hover:border-blue-400"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                            {ticket.orderId && (
                              <span className="text-xs font-mono text-gray-500">#{ticket.orderId}</span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 leading-snug">{ticket.subject}</h3>
                          {lastMessage && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-1">{lastMessage.text}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col bg-gray-50"><Navbar /></div>}>
      <SupportPageContent />
    </Suspense>
  );
}