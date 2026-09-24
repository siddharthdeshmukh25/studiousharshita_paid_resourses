'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Star } from 'lucide-react';

interface QuickRatingModalProps {
  isOpen: boolean;
  resourceName: string;
  submitting: boolean;
  error: string | null;
  thanked: boolean;
  onSubmit: (rating: number, comment: string) => void;
  onClose: () => void;
}

const PRAISE: Record<number, string> = {
  5: 'Yay! That just made my day ♡',
  4: 'So glad it helped! ♡',
  3: 'Thanks! I will keep improving ♡',
  2: 'Thanks for the honesty ♡',
  1: 'Thanks for the honest feedback ♡',
};

/**
 * The cute quick-rating popup. It appears when a student opens the resource
 * file and comes back to the tab — the exact moment the resource is fresh in
 * their mind. Stars are mandatory, a comment is optional, and "maybe later"
 * is always one click away. Keeping friction near zero is the whole point.
 */
export default function QuickRatingModal({ isOpen, resourceName, submitting, error, thanked, onSubmit, onClose }: QuickRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Reset every time it opens.
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Rate this resource"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#FFFDF8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top */}
        <div className="relative bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] px-6 pb-8 pt-6 text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
            className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15 text-3xl backdrop-blur">
            {thanked ? '🎉' : '✨'}
          </div>
          <p className="font-hand mt-2 text-2xl text-white">
            {thanked ? 'thank you!' : 'How did you like it?'}
          </p>
          {!thanked && (
            <p className="mt-1 text-xs font-medium text-white/85">only 10 seconds — just tap the stars ♡</p>
          )}
        </div>

        {thanked ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {PRAISE[rating] || 'thanks for rating! ♡'}
            </p>
            <p className="mt-1 text-xs text-[#6B6257]">
              Your rating helps other students pick the right notes.
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-4">
            <p className="truncate text-center text-sm font-bold text-[#1A1A1A]" title={resourceName}>
              {resourceName}
            </p>

            {/* Big friendly stars */}
            <div className="mt-4 flex items-center justify-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  onMouseEnter={() => setHoverRating(value)}
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                  className="transition-transform hover:scale-125 active:scale-110"
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      value <= activeRating ? 'fill-[#D9A93F] text-[#D9A93F]' : 'text-[#D8CFC0]'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Optional comment — appears directly once a star is tapped */}
            {rating > 0 && (
              <div className="mt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={2}
                  placeholder="Want to say something? (optional)"
                  className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#A29785] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
                <div className="mt-1 text-right text-[11px] text-[#A29785]">{comment.length}/200</div>
              </div>
            )}

            {error && <p className="mt-2 text-center text-xs font-semibold text-[#B4544A]">{error}</p>}

            <button
              type="button"
              disabled={rating === 0 || submitting}
              onClick={() => onSubmit(rating, comment)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> sending…
                </>
              ) : (
                'Submit rating'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="mx-auto mt-2 block text-xs font-medium text-[#A29785] transition-colors hover:text-[#6B6257]"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
