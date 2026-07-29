'use client';

import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

type PaymentState = 'verifying' | 'success' | 'error';

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<PaymentState>('verifying');
  const [message, setMessage] = useState('Confirming your payment securely.');

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (!orderId) { setState('error'); setMessage('We could not identify this payment order.'); return; }
    const verify = async () => {
      try {
        const response = await fetch('/api/checkout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error || 'Payment verification failed.');
        setState('success');
        setMessage('Payment confirmed. Your resource is ready in your dashboard.');
      } catch (error) {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Payment verification failed.');
      }
    };
    verify();
  }, [searchParams]);

  return <div className="academic-surface min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white p-7 text-center shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
        {state === 'verifying' && <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2563EB]" />}
        {state === 'success' && <CheckCircle2 className="mx-auto h-10 w-10 text-[#06B6D4]" />}
        {state === 'error' && <CircleAlert className="mx-auto h-10 w-10 text-[#EF4444]" />}
        <h1 className="mt-5 text-xl font-bold text-[#0F172A]">{state === 'verifying' ? 'Verifying payment' : state === 'success' ? 'Payment successful' : 'Payment needs attention'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">{message}</p>
        {state !== 'verifying' && <button onClick={() => router.push(state === 'success' ? '/dashboard' : '/')} className="mt-6 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors">{state === 'success' ? 'Open dashboard' : 'Return home'}</button>}
      </section>
    </main>
    <Footer />
  </div>;
}

export default function PaymentReturnPage() {
  return <Suspense fallback={<div className="academic-surface min-h-screen" />}><PaymentReturnContent /></Suspense>;
}
