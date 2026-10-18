'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';

type Props = { className?: string };

export default function ReferralApplyButton({ className = '' }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const startEarning = () => {
    if (status === 'authenticated') {
      router.push('/profile#refer-earn');
      return;
    }

    setShowLoginModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={startEarning}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_5px_0_var(--accent-deep),0_14px_25px_-15px_rgba(38,72,54,0.7)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 ${className}`}
      >
        Start earning <ArrowRight className="h-4 w-4" />
      </button>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        callbackUrl="/profile#refer-earn"
      />
    </>
  );
}
