'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { X, Lock, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Keep the page width unchanged when the browser scrollbar is hidden.
      // Without this, desktop content shifts sideways as soon as the modal opens.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: window.location.href });
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0F172A]/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-[#0F172A]/20">
        {/* Decorative glow */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--accent)]/15" style={{ filter: 'blur(40px)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[var(--sage)]/15" style={{ filter: 'blur(40px)' }} />

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--accent-deep)] via-[var(--accent)] to-[#0891B2] px-6 pb-16 pt-7 sm:px-8">
          <button
            onClick={onClose}
            aria-label="Close login modal"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white/90 backdrop-blur transition-colors hover:bg-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Studious Harshita
          </span>
          <h2 className="mt-3 font-serif text-3xl italic leading-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-sm text-white/85">
            Sign in to unlock your notes and keep your purchases in one place.
          </p>
        </div>

        {/* Card body overlapping the header */}
        <div className="relative -mt-10 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xl shadow-[#0F172A]/5 sm:p-6">
            {/* Trust features */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-[#F0FDF9] px-3 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold leading-tight text-[#334155]">Secure login</p>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-[#F8FAFC] px-3 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0F172A] text-white">
                  <Lock className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold leading-tight text-[#334155]">Data protected</p>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-[#E2E8F0] bg-white py-3.5 px-6 text-[15px] font-semibold text-[#1E293B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[var(--accent)]" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Footer */}
            <p className="mt-5 text-center text-xs leading-relaxed text-[#94A3B8]">
              By continuing, you agree to our{' '}
              <a href="/terms-of-service" className="font-medium text-[var(--accent)] hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="font-medium text-[var(--accent)] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
