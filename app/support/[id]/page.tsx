'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  Circle,
  User,
  ShieldCheck,
} from 'lucide-react';

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
  orderId?: string;
  message: string;
  createdAt: string;
  messages?: Message[];
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  open: { label: 'Open', className: 'bg-[var(--accent-soft-2)] text-[var(--accent-text)]', icon: <Circle className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In progress', className: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3.5 w-3.5" /> },
  resolved: { label: 'Resolved', className: 'bg-blue-100 text-blue-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700', icon: <Circle className="h-3.5 w-3.5" /> },
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadTicket = async () => {
    try {
      const response = await fetch(`/api/support/${params.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load ticket');
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      const timer = setTimeout(() => loadTicket(), 0);
      return () => clearTimeout(timer);
    }
  }, [params.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    setSendError(null);
    try {
      const response = await fetch(`/api/support/${ticket._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reply');
      setReply('');
      setTicket(data.ticket);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket not found</h2>
            <button onClick={() => router.push('/support')} className="text-[var(--accent)] hover:underline font-medium">
              Back to support center
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const meta = STATUS_META[ticket.status] || STATUS_META.open;
  const allMessages = [
    { author: 'user' as const, text: ticket.message, createdAt: ticket.createdAt },
    ...(ticket.messages || []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <button
            onClick={() => router.push('/support')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to support center
          </button>

          {/* Ticket header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 mb-1">
                  Ticket · {ticket.category.replace('_', ' ')}
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                {ticket.orderId && (
                  <p className="mt-1 text-sm text-gray-500">
                    Order ID: <span className="font-mono">{ticket.orderId}</span>
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${meta.className}`}>
                {meta.icon}
                {meta.label}
              </span>
            </div>
          </div>

          {/* Conversation */}
          <div className="space-y-4 mb-8">
            {allMessages.map((msg, index) => {
              const isUser = msg.author === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm text-gray-900'
                  }`}>
                    <div className={`flex items-center gap-2 mb-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {isUser ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {isUser ? (session?.user?.name || 'You') : 'Support team'}
                      </span>
                      <span className="text-xs opacity-80">
                        {new Date(msg.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className={`text-base leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply box */}
          {ticket.status !== 'closed' ? (
            <form onSubmit={handleReply} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <label htmlFor="reply-text" className="block text-sm font-semibold text-gray-900 mb-2">
                Add a message
              </label>
              {sendError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{sendError}</div>}
              <textarea
                id="reply-text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write your reply…"
                rows={4}
                maxLength={5000}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Send message
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-base text-gray-600">This ticket is closed. Open a new ticket if you need further help.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}