'use client';

import { useEffect, useRef, useState } from 'react';
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
  const conversationRef = useRef<HTMLDivElement>(null);

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

  // Keep the chat scrolled to the newest message.
  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight });
  }, [ticket]);

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
      </div>
    );
  }

  const meta = STATUS_META[ticket.status] || STATUS_META.open;
  const allMessages = [
    { author: 'user' as const, text: ticket.message, createdAt: ticket.createdAt },
    ...(ticket.messages || []),
  ];

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      {/* Chat layout: conversation scrolls, composer stays pinned at the bottom */}
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/support')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-3 md:mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to support center
        </button>

        {/* Ticket header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm p-3 md:p-4 mb-3 md:mb-4 flex-shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 md:mb-1.5">
                Ticket · {ticket.category.replace('_', ' ')}
              </p>
              <h1 className="text-sm md:text-lg font-semibold text-gray-900">{ticket.subject}</h1>
              {ticket.orderId && (
                <p className="mt-1 text-xs text-gray-500">
                  Order ID: <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded">{ticket.orderId}</span>
                </p>
              )}
            </div>
            <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold ${meta.className}`}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
        </div>

        {/* Conversation (scrollable) */}
        <div ref={conversationRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 md:space-y-4 mb-3 md:mb-4 custom-scrollbar">
          {allMessages.map((msg, index) => {
            const isUser = msg.author === 'user';
            return (
              <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 shadow-sm ${isUser
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                  : 'bg-white border border-gray-200/60 text-gray-900'
                }`}>
                  <div className={`flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {isUser ? <User className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                    <span className="text-[10px] md:text-xs font-semibold">
                      {isUser ? (session?.user?.name || 'You') : 'Support team'}
                    </span>
                    <span className="text-[10px] md:text-xs opacity-70">
                      {new Date(msg.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply box — pinned at the bottom */}
        <div className="flex-shrink-0 -mx-3 px-3 sm:mx-0 sm:px-0 pb-2 md:pb-0">
          {ticket.status !== 'closed' ? (
            <form onSubmit={handleReply} className="bg-white rounded-xl border border-gray-200 p-2 md:p-3">
              {sendError && <div className="mb-2 md:mb-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg text-xs md:text-sm text-red-700">{sendError}</div>}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    id="reply-text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply…"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 text-xs md:text-sm text-gray-900 outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] md:text-xs text-gray-400">
                    {reply.length}/500
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="flex-shrink-0 h-10 md:h-11 w-10 md:w-11 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xs md:text-sm text-gray-600">This ticket is closed. Open a new ticket if you need further help.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}