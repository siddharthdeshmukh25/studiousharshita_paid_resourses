'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/**
 * Site-wide toast system styled to match the warm cream theme: curved cards,
 * soft shadow, backdrop blur, sliding in at the top ~5% of the screen.
 * Success / error / info variants with auto-dismiss and a manual close button.
 */
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-[5%] z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-[var(--line)] bg-[#FFFDF8]/90 px-4 py-3 shadow-[0_12px_32px_rgba(26,26,26,0.18)] backdrop-blur-md toast-slide-in"
          >
            {item.type === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />}
            {item.type === 'error' && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B4544A]" />}
            {item.type === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#6B6257]" />}
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#1A1A1A]">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded-full p-1 text-[#A29785] transition-colors hover:bg-[var(--accent-soft)] hover:text-[#1A1A1A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
