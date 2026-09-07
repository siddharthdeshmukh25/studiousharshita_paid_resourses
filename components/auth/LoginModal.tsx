'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { X, Lock, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 backdrop-blur-none p-4">
      <div className="bg-[#FFFFFF] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-[#E2E8F0]">
        <div className="bg-[var(--accent)] px-6 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-[#E0F2FE] text-sm mt-1">Sign in to continue</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close login modal"
              className="p-2 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-sm text-[#64748B]">
              <Shield className="h-4 w-4 text-[var(--accent)] mr-3" />
              <span>Secure and safe login</span>
            </div>
            <div className="flex items-center text-sm text-[#64748B]">
              <Lock className="h-4 w-4 text-[var(--accent)] mr-3" />
              <span>Your data is protected</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-[#CBD5E1] hover:border-[#06B6D4] hover:bg-[#F8FAFC] text-[#1E293B] py-4 px-6 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-[#E2E8F0] border-t-[#06B6D4] rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6" viewBox="0 0 24 24">
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
                <span className="text-base">Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[#EFF6FF]">
            <p className="text-xs text-[#64748B] text-center leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="/terms-of-service" className="text-[var(--accent)] hover:text-[#0F172A] underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-[var(--accent)] hover:text-[#0F172A] underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
