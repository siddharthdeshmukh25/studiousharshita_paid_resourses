'use client';

import { Star, Heart, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/contexts/WishlistContext';
import { discountedPrice, formatPrice } from '@/lib/format';

interface ResourceCardProps {
  id: string; title: string; rating: number; reviewCount: number; price: number; discount?: number;
  thumbnailUrl?: string; images?: string[]; category?: string; authorName?: string; authorAvatar?: string; downloads?: number;
  updatedAt?: string; onGetResource?: () => void;
}

/**
 * Clean e-commerce style card: square cover image, no inner CTA button —
 * the whole card is clickable via onGetResource. Flat edges (rounded-none)
 * so cards sit flush against each other in gap-0 grids.
 */
export default function ResourceCard({ id, title, rating, reviewCount, price, discount, thumbnailUrl, images, category, authorName, authorAvatar, downloads, onGetResource }: ResourceCardProps) {
  const { data: session } = useSession();
  const { isResourceWishlisted, refreshWishlist } = useWishlist();
  const isWishlisted = isResourceWishlisted(id);
  const isFree = price === 0;
  const finalPrice = discountedPrice(price, discount);
  const displayDiscount = discount && discount > 0 ? Math.round(discount) : undefined;
  const hasRating = rating > 0 && reviewCount > 0;
  const displayImage = images && images.length > 0 ? images[0] : thumbnailUrl;

  const promptLogin = () => (document.querySelector('[data-login-trigger="true"]') as HTMLButtonElement | null)?.click();
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); if (!session) { promptLogin(); return; }
    try {
      const response = isWishlisted ? await fetch(`/api/wishlist?resourceId=${id}`, { method: 'DELETE' }) : await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resourceId: id }) });
      if (response.ok) {
        await refreshWishlist();
      }
    } catch (error) { console.error('Error toggling wishlist:', error); }
  };

  return (
    <article
      onClick={onGetResource}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-none border border-[#E2E8F0] bg-[#FFFFFF]"
    >
      {/* Square cover */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--accent-soft)]">
        {displayImage ? (
          <img src={displayImage} alt={title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-sm text-[#64748B]">Thumbnail</span>
        )}
        {/* Free / discount flag */}
        {isFree ? (
          <span className="absolute left-0 top-3 bg-[var(--accent)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">Free</span>
        ) : displayDiscount ? (
          <span className="absolute left-0 top-3 bg-red-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">{displayDiscount}% off</span>
        ) : null}
        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-[#FFFFFF]/95 text-[#64748B] shadow-sm backdrop-blur"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[var(--sage)] text-[var(--accent)]' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-grow flex-col gap-1 p-3 sm:p-4">
        {category && <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{category}</p>}
        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#0F172A] sm:text-[15px]">{title}</h3>
        {authorName && (
          <div className="flex items-center gap-1.5">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--sage)] text-[9px] font-semibold text-white">{authorName.charAt(0)}</span>
            )}
            <span className="flex items-center truncate text-[11px] text-[#64748B]">{authorName}<CheckCircle className="ml-1 h-2.5 w-2.5 shrink-0 text-[var(--accent)]" /></span>
          </div>
        )}
        {hasRating && (
          <div className="flex items-center gap-1">
            <span className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#CBD5E1]'}`} />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-[#475569]">{rating.toFixed(1)} <span className="font-normal text-[#94A3B8]">({reviewCount})</span></span>
          </div>
        )}
        {/* Price line */}
        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          {isFree ? (
            <span className="text-base font-extrabold text-[var(--accent)] sm:text-lg">Free</span>
          ) : (
            <>
              {displayDiscount && <span className="text-xs text-[#94A3B8] line-through">{formatPrice(price)}</span>}
              <span className="text-base font-extrabold text-[#0F172A] sm:text-lg">{formatPrice(finalPrice)}</span>
            </>
          )}
          {downloads ? <span className="ml-auto text-[10px] text-[#94A3B8]">{downloads} downloads</span> : null}
        </div>
      </div>
    </article>
  );
}
