'use client';

import { useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

const PARTNERSHIP_TYPES = [
  { value: 'sponsored-post', label: 'Sponsored post' },
  { value: 'brand-integration', label: 'Brand integration' },
  { value: 'product-review', label: 'Product review' },
  { value: 'affiliate', label: 'Affiliate partnership' },
  { value: 'other', label: 'Something else' },
];

const BUDGET_RANGES = [
  { value: 'undecided', label: 'Not decided yet' },
  { value: 'under-25k', label: 'Under ₹25,000' },
  { value: '25k-75k', label: '₹25,000 – ₹75,000' },
  { value: '75k-2l', label: '₹75,000 – ₹2,00,000' },
  { value: '2l-plus', label: '₹2,00,000+' },
];

export default function CollaborationEnquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [brand, setBrand] = useState('');
  const [partnershipType, setPartnershipType] = useState('sponsored-post');
  const [budget, setBudget] = useState('undecided');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setBrand('');
    setPartnershipType('sponsored-post');
    setBudget('undecided');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Please enter a valid email address.');
    }
    if (!brand.trim()) return setError('Please tell me your brand or company name.');
    if (message.trim().length < 10) return setError('Please describe your idea in at least 10 characters.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, brand, partnershipType, budget, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send your enquiry.');
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[var(--line)] bg-[#FFFDF8] px-4 py-3 text-base text-[#1A1A1A] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';
  const labelClass = 'block text-sm font-semibold text-[#1A1A1A] mb-2';

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[#FFFDF8] p-6 shadow-sm md:p-8">
      <h2 className="mb-1 text-xl font-bold text-[#1A1A1A]">Start a partnership</h2>
      <p className="mb-6 text-base text-[#6B6257]">
        Share your brand and idea — you&apos;ll hear back within 2 business days.
      </p>

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--accent-soft-2)] bg-[var(--accent-soft)] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--accent)]" />
          <div>
            <p className="font-semibold text-[var(--accent-deep)]">Enquiry sent!</p>
            <p className="text-sm text-[var(--accent-deep)]">
              Thank you for reaching out. A reply with the media kit is on its way to your inbox.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="collab-name" className={labelClass}>Your name</label>
            <input
              id="collab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="collab-email" className={labelClass}>Work email</label>
            <input
              id="collab-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="collab-brand" className={labelClass}>Brand / company</label>
            <input
              id="collab-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand name"
              maxLength={120}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="collab-type" className={labelClass}>Partnership type</label>
            <select
              id="collab-type"
              value={partnershipType}
              onChange={(e) => setPartnershipType(e.target.value)}
              className={inputClass}
            >
              {PARTNERSHIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="collab-budget" className={labelClass}>Budget range</label>
          <select
            id="collab-budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={inputClass}
          >
            {BUDGET_RANGES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="collab-message" className={labelClass}>Your idea</label>
          <textarea
            id="collab-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell me about your product, the campaign idea, timeline and deliverables you have in mind…"
            rows={6}
            maxLength={5000}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Send enquiry
          </button>
        </div>
      </form>
    </div>
  );
}