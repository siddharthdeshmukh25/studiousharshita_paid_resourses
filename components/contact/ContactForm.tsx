'use client';

import { useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'project', label: 'Student project' },
  { value: 'payment', label: 'Payment issue' },
  { value: 'access', label: 'Access / download problem' },
  { value: 'refund', label: 'Refund request' },
];

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setCategory('general');
    setSubject('');
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
    if (!subject.trim()) return setError('Please enter a subject.');
    if (!message.trim()) return setError('Please write your message.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send your message.');
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
      <p className="text-base text-gray-600 mb-6">
        Fill in the form below and our team will get back to you within 24-48 business hours.
      </p>

      {success && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Message sent!</p>
            <p className="text-sm text-blue-700">Thank you for reaching out. We will reply to your email shortly.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-900 mb-2">Your name</label>
            <input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-900 mb-2">Email address</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-topic" className="block text-sm font-semibold text-gray-900 mb-2">Topic</label>
            <select
              id="contact-topic"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-sm font-semibold text-gray-900 mb-2">Subject</label>
            <input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-900 mb-2">Your message</label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your query or project details here…"
            rows={6}
            maxLength={5000}
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
            Send message
          </button>
        </div>
      </form>
    </section>
  );
}