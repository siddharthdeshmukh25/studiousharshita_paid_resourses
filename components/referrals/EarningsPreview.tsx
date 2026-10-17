'use client';

import { useEffect, useState } from 'react';
import { Banknote, Sparkles } from 'lucide-react';

const demoRows = [
  { label: 'Aarav', amount: '$4.20', delay: '0ms', colors: 'from-[#E8C8B8] to-[#F7E5D6] text-[#76513E]' },
  { label: 'Diya', amount: '$3.15', delay: '120ms', colors: 'from-[#C7D9C8] to-[#E7F0E4] text-[#3E674D]' },
  { label: 'Rohan', amount: '$5.14', delay: '240ms', colors: 'from-[#D4C9E7] to-[#EEE7F5] text-[#65507E]' },
];

// Fictional first names for this UI mockup; the visible Demo badge labels them as examples.

export default function EarningsPreview() {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const target = 12.49;
    const duration = 1400;
    const start = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    if (reduceMotion) {
      frame = window.requestAnimationFrame(() => setAmount(target));
      return () => window.cancelAnimationFrame(frame);
    }

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 4;
      setAmount(target * eased);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md [perspective:1100px]">
      <div className="relative rounded-[1.7rem] border border-white bg-gradient-to-br from-[var(--accent-soft)] via-[#FFFCF4] to-[#EAF3EC] p-3.5 shadow-[0_24px_55px_-28px_rgba(38,72,54,0.48)] sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/80 blur-2xl" />
        <div className="relative rotate-[1deg] rounded-2xl border border-white/80 bg-[#FFFDF8] p-4 shadow-[0_12px_0_rgba(53,78,60,0.12),0_22px_30px_-18px_rgba(53,78,60,0.4)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--accent-deep)] sm:text-xs">Earnings preview</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-[#24352B] sm:text-xl">A little progress adds up</h2>
            </div>
            <span className="grid h-10 w-10 shrink-0 -rotate-6 place-items-center rounded-xl bg-gradient-to-br from-[#E9F4E8] to-white text-[var(--accent)] shadow-[0_5px_0_rgba(52,81,63,0.14)] sm:h-11 sm:w-11"><Banknote className="h-5 w-5" /></span>
          </div>

          <div className="mt-4 rounded-xl bg-gradient-to-r from-[#EDF5ED] to-[#F8F3E8] p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#6B796D]">Example balance</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#788578]"><Sparkles className="h-3 w-3 text-[#C28A3B]" /> Demo</span>
            </div>
            <p className="mt-1 tabular-nums text-3xl font-black tracking-tight text-[#273D30] sm:text-4xl" aria-label={`Illustrative example balance: $${amount.toFixed(2)}`}>
              ${amount.toFixed(2)}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#718073] sm:text-[11px]">Illustrative UI only — not actual student earnings or a payout promise.</p>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-[#24352B]">Recent activity</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F7E8C5] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#815B20]"><Sparkles className="h-2.5 w-2.5" /> Demo</span>
            </div>
            <ul className="space-y-2">
              {demoRows.map((row) => (
                <li key={row.delay} className="flex items-center gap-2.5 rounded-lg bg-[#FAF9F5] px-2 py-1.5 text-xs" style={{ animationDelay: row.delay }}>
                  <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br shadow-sm ring-2 ring-white ${row.colors}`}>
                    <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor">
                      <circle cx="16" cy="10" r="6" />
                      <path d="M4.5 28c.8-6.2 5.1-9.5 11.5-9.5S26.7 21.8 27.5 28H4.5Z" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[#718073]">{row.label}</span>
                  <span className="tabular-nums font-bold text-[#39734E]">+{row.amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[10px] font-semibold text-[#718073] sm:text-xs"><span>Flexible sharing</span><span>Made for students</span></div>
        </div>
      </div>
    </div>
  );
}
