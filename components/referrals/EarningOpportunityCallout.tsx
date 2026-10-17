import Link from 'next/link';
import { ArrowRight, Banknote, Sparkles } from 'lucide-react';

type Props = { className?: string };

export default function EarningOpportunityCallout({ className = '' }: Props) {
  return (
    <aside className={`relative isolate overflow-hidden rounded-2xl border border-[#D3A957]/55 border-l-4 border-l-[#C28A3B] bg-gradient-to-r from-[#F5F0DA] via-[#EDF4E8] to-[#E3F0E8] p-3.5 shadow-[0_5px_0_rgba(69,92,79,0.14),0_14px_28px_-18px_rgba(34,55,47,0.46)] sm:p-4 ${className}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-[#F2D897]/60 blur-2xl" />
      <div className="relative flex items-center gap-2.5 sm:gap-3">
        <span className="grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-xl border border-white/90 bg-gradient-to-br from-white to-[#E4EEE5] text-[var(--accent-deep)] shadow-[0_4px_0_rgba(52,81,63,0.17),0_7px_12px_rgba(52,81,63,0.14)] sm:h-11 sm:w-11">
          <Banknote className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-serif-display text-sm font-bold leading-tight tracking-tight text-[#263B31] sm:text-base">Student earning opportunities</p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F7E8C5] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#815B20] sm:px-2 sm:text-[9px]">
              <Sparkles className="h-2.5 w-2.5" /> For students
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-[#4D6657] sm:text-xs">Share what you love and explore earning opportunities with Studious Harshita.</p>
        </div>
        <Link href="/referral-program" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--accent-deep)] px-2.5 py-2 text-[11px] font-extrabold text-white shadow-[0_3px_0_#17382f,0_6px_12px_rgba(38,72,54,0.2)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:gap-1.5 sm:px-3.5 sm:py-2.5 sm:text-xs">
          Start earning <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
