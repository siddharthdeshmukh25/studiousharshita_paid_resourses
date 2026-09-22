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
 * Clean e-commerce style card with a "polaroid" cover: the image sits inset
 * inside a padded white frame instead of bleeding to the card edges, so cards
 * get even breathing room in spaced (gap-4/gap-6) grids. The whole card is
 * clickable via onGetResource. All colors come from the site theme variables
 * (--accent-*, --line, --card-*) so an admin theme change recolors these too.
 */
export default function ResourceCard({ id, title, rating, reviewCount, price, discount, thumbnailUrl, images, category, authorName, authorAvatar, downloads, onGetResource }: ResourceCardProps) {
  const { data: session } = useSession();
  const { isResourceWishlisted, refreshWishlist } = useWishlist();
  const isWishlisted = isResourceWishlisted(id);
  const isFree = price === 0;
  // Coerce the discount so a string value ("20") from older API payloads still
  // renders the discounted price instead of silently hiding it.
  const discountValue = Number(discount);
  const hasDiscount = Number.isFinite(discountValue) && discountValue > 0 && discountValue < 100;
  const finalPrice = hasDiscount ? discountedPrice(price, discountValue) : price;
  const displayDiscount = hasDiscount ? Math.round(discountValue) : undefined;
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
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-bg)] shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Square cover — polaroid style: image inset inside a padded white frame */}
      <div className="w-full bg-[var(--card-bg)] p-2 sm:p-2.5">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--accent-soft)]">
          {displayImage ? (
            <img src={displayImage} alt={title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-sm text-[var(--text-secondary)]">Thumbnail</span>
          )}
          {/* Free / discount flag */}
          {isFree ? (
            <span className="absolute left-2 top-2 rounded-md bg-[var(--accent)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">Free</span>
          ) : displayDiscount ? (
            <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">{displayDiscount}% off</span>
          ) : null}
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            aria-label="Add to wishlist"
            className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-[var(--card-bg)]/95 text-[var(--text-secondary)] shadow-sm backdrop-blur"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-[var(--accent)] text-[var(--accent)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-grow flex-col gap-1 p-3 sm:p-4">
        {category && <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">{category}</p>}
        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--text-primary)] sm:text-[15px]">{title}</h3>
        {authorName && (
          <div className="flex items-center gap-1.5">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--accent-soft-2)] text-[9px] font-semibold text-[var(--accent-text)]">{authorName.charAt(0)}</span>
            )}
            <span className="flex items-center truncate text-[11px] text-[var(--text-secondary)]">{authorName}<CheckCircle className="ml-1 h-2.5 w-2.5 shrink-0 text-[var(--accent)]" /></span>
          </div>
        )}
        {hasRating && (
          <div className="flex items-center gap-1">
            <span className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--line)]'}`} />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{rating.toFixed(1)} <span className="font-normal text-[var(--text-muted)]">({reviewCount})</span></span>
          </div>
        )}
        {/* Price line */}
        <div className="mt-auto flex items-baseline gap-1.5 pt-1.5">
          {isFree ? (
            <span className="text-base font-extrabold text-[var(--accent)] sm:text-lg">Free</span>
          ) : (
            <>
              {displayDiscount && <span className="text-xs text-[var(--text-muted)] line-through">{formatPrice(price)}</span>}
              <span className="text-base font-extrabold text-[var(--text-primary)] sm:text-lg">{formatPrice(finalPrice)}</span>
            </>
          )}
          {downloads ? <span className="ml-auto text-[10px] text-[var(--text-muted)]">{downloads} downloads</span> : null}
        </div>
      </div>
    </article>
  );
}
