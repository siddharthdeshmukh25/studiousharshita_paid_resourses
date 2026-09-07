'use client';

import { Star, Heart, Download, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/contexts/WishlistContext';

interface ResourceCardProps {
  id: string; title: string; rating: number; reviewCount: number; price: number; discount?: number;
  thumbnailUrl?: string; images?: string[]; category?: string; authorName?: string; authorAvatar?: string; downloads?: number;
  updatedAt?: string; onGetResource?: () => void;
}

export default function ResourceCard({ id, title, rating, reviewCount, price, discount, thumbnailUrl, images, category, authorName, authorAvatar, downloads, onGetResource }: ResourceCardProps) {
  const { data: session } = useSession();
  const { isResourceWishlisted, refreshWishlist } = useWishlist();
  const isWishlisted = isResourceWishlisted(id);
  const isFree = price === 0;
  const finalPrice = discount && discount > 0 ? (price * (1 - discount / 100)).toFixed(2) : price;
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

  return <article className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative h-32 w-full overflow-hidden bg-[var(--accent-soft)] sm:h-44 md:h-52">
      {displayImage ? <img src={displayImage} alt={title} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-sm text-[#64748B]">Thumbnail</span>}
      {category && <span className="absolute left-2 top-2 rounded-md bg-[#FFFFFF]/95 px-2 py-1 text-[10px] font-semibold text-[var(--accent)] shadow-sm sm:px-3 sm:text-xs">{category}</span>}
      <button onClick={toggleWishlist} aria-label="Add to wishlist" className="absolute right-2 top-2 rounded-md bg-[#FFFFFF]/95 p-1.5 text-[#64748B] shadow-sm hover:bg-white hover:text-[var(--accent)] transition-colors sm:p-2"><Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isWishlisted ? 'fill-[#06B6D4] text-[var(--accent)]' : ''}`} /></button>
    </div>
    <div className="flex flex-grow flex-col p-2.5 sm:p-4">
      <h3 className="mb-1.5 line-clamp-2 text-xs font-bold leading-snug text-[#0F172A] sm:mb-2 sm:text-base">{title}</h3>
      {authorName && <div className="mb-2 flex items-center gap-2 sm:mb-3">{authorAvatar ? <img src={authorAvatar} alt={authorName} className="h-4 w-4 rounded-full object-cover sm:h-6 sm:w-6" /> : <span className="grid h-4 w-4 place-items-center rounded-full bg-[#06B6D4] text-[9px] font-semibold text-white sm:h-6 sm:w-6 sm:text-xs">{authorName.charAt(0)}</span>}<span className="flex items-center text-xs text-[#64748B] sm:text-sm">{authorName}<CheckCircle className="ml-1 h-2 w-2 text-[var(--accent)] sm:h-3 sm:w-3" /></span></div>}
      {(hasRating || downloads) && <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">{hasRating && <div className="flex items-center gap-1"><span className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-[#CBD5E1]'}`} />)}</span><span className="text-[9px] font-semibold text-[#1E293B] sm:text-xs">{rating.toFixed(1)} ({reviewCount})</span></div>}{downloads && <span className="flex items-center text-[9px] text-[#64748B] sm:text-xs"><Download className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />{downloads}</span>}</div>}
      <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-[#EFF6FF] pt-2 sm:pt-3"><div className="min-w-0">{isFree ? <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:text-xs">Free</span> : <>{displayDiscount && <p className="text-[10px] leading-none text-[#94A3B8] line-through sm:text-xs">Rs. {price}</p>}<span className="block text-sm font-bold leading-tight text-[#0F172A] sm:text-lg">Rs. {finalPrice}</span>{displayDiscount && <span className="text-[8px] font-semibold text-red-500 uppercase sm:text-[10px]">{displayDiscount}% OFF</span>}</>}<span className="block text-[8px] uppercase text-[#94A3B8] sm:text-[10px]">Lifetime</span></div><button onClick={onGetResource} className={`shrink-0 rounded-md px-2 py-1.5 text-[10px] font-semibold text-white transition-colors sm:px-4 sm:py-2 sm:text-sm ${isFree ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[var(--accent)] hover:bg-[var(--accent-deep)]'}`}>{isFree ? 'Get free' : 'Get'}</button></div>
    </div>
  </article>;
}
