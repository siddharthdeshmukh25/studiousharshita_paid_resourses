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
  resolved: { label: 'Resolved', className: 'bg-[var(--accent-soft)] text-[var(--accent-deep)]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  closed: { label: 'Closed', className: 'bg-[var(--accent-soft)] text-[#4A443B]', icon: <Circle className="h-3.5 w-3.5" /> },
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
      <div className="h-dvh flex flex-col bg-gradient-to-br from-[var(--background)] to-[var(--accent-soft)]">
        <Navbar />
        <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-3 py-3 sm:px-6 md:py-8" role="status" aria-label="Loading support conversation">
          <div className="flex min-h-0 flex-1 flex-col animate-pulse">
            <div className="mb-4 h-5 w-28 rounded bg-[var(--accent-soft-2)]" />
            <div className="min-h-64 flex-1 space-y-4 rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-4 sm:p-6">
              <div className="h-20 w-4/5 rounded-2xl bg-[var(--accent-soft-2)]" />
              <div className="ml-auto h-20 w-3/4 rounded-2xl bg-[var(--accent-soft-2)]" />
              <div className="h-20 w-2/3 rounded-2xl bg-[var(--accent-soft-2)]" />
            </div>
            <div className="mt-4 h-12 shrink-0 rounded-xl bg-[var(--accent-soft-2)]" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <main className="min-h-[60vh] flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Ticket not found</h2>
            <button onClick={() => router.push('/support')} className="text-[var(--accent)] hover:underline font-medium">
              Back to support center
            </button>
          </div>
        </main>
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
    <div className="h-dvh flex flex-col bg-gradient-to-br from-[var(--background)] to-[var(--accent-soft)]">
      <Navbar />

      {/* Chat layout: conversation scrolls, composer stays pinned at the bottom */}
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/support')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6257] hover:text-[#1A1A1A] mb-3 md:mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to support center
        </button>

        {/* Ticket header */}
        <div className="bg-[#FFFDF8]/80 backdrop-blur-sm rounded-xl border border-[var(--line)]/60 shadow-sm p-3 md:p-4 mb-3 md:mb-4 flex-shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#6B6257] mb-1 md:mb-1.5">
                Ticket · {ticket.category.replace('_', ' ')}
              </p>
              <h1 className="text-sm md:text-lg font-semibold text-[#1A1A1A]">{ticket.subject}</h1>
              {ticket.orderId && (
                <p className="mt-1 text-xs text-[#6B6257]">
                  Order ID: <span className="font-mono text-[10px] bg-[var(--accent-soft)] px-2 py-0.5 rounded">{ticket.orderId}</span>
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
                  ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white'
                  : 'bg-[#FFFDF8] border border-[var(--line)]/60 text-[#1A1A1A]'
                }`}>
                  <div className={`flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 ${isUser ? 'text-[#FDFBF6]' : 'text-[#6B6257]'}`}>
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
                  <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-[#1A1A1A]'}`}>
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
            <form onSubmit={handleReply} className="bg-[#FFFDF8] rounded-xl border border-[var(--line)] p-2 md:p-3">
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
                    className="w-full rounded-lg border border-[var(--line)] bg-[#FFFDF8] px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 text-xs md:text-sm text-[#1A1A1A] outline-none focus:border-[var(--accent)] resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] md:text-xs text-[#A29785]">
                    {reply.length}/500
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="flex-shrink-0 h-10 md:h-11 w-10 md:w-11 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-deep)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#FFFDF8] border border-[var(--line)] rounded-xl p-3 md:p-4 text-center">
              <p className="text-xs md:text-sm text-[#6B6257]">This ticket is closed. Open a new ticket if you need further help.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}