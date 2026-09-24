'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResourceCard from '@/components/resource/ResourceCard';

/**
 * Recently viewed tracker + shelf, powered entirely by localStorage.
 * Call trackRecentlyViewed(id) from a product page; render <RecentlyViewed />
 * to show the shelf (current resource is automatically excluded).
 * Lazy: the shelf only fetches when the user scrolls near it, so the main
 * content above always arrives first.
 */

const STORAGE_KEY = 'sh_recently_viewed';
const MAX_ITEMS = 8;

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Record a resource view — most-recent-first, de-duplicated, capped. */
export function trackRecentlyViewed(resourceId: string) {
  if (!resourceId) return;
  try {
    const next = [resourceId, ...readIds().filter((id) => id !== resourceId)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private browsing / storage full — silently skip */
  }
}

interface ViewedResource {
  _id: string;
  title: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
}

/** One-color skeleton shelf matching the resource page skeleton tone. */
function ShelfSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="-mx-1 flex gap-2.5 overflow-hidden px-1 min-[600px]:mx-0 min-[600px]:grid min-[600px]:grid-cols-3 min-[600px]:gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[62%] max-w-[240px] shrink-0 min-[600px]:w-full min-[600px]:max-w-none min-[600px]:shrink">
            <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-bg)] p-2 sm:p-2.5">
              <div className="aspect-square w-full rounded-lg bg-[var(--accent-soft-2)]" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-[var(--accent-soft-2)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--accent-soft-2)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecentlyViewed({ currentResourceId }: { currentResourceId?: string }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [resources, setResources] = useState<ViewedResource[]>([]);

  // Wait until the section is (nearly) in view before reading storage/fetching.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || shouldLoad) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;

    const ids = readIds().filter((id) => id !== currentResourceId);
    if (ids.length === 0) {
      setResources([]);
      setLoaded(true);
      return;
    }

    fetch(`/api/resources?ids=${encodeURIComponent(ids.join(','))}`)
      .then((res) => res.json() as Promise<{ resources: ViewedResource[] }>)
      .then((data) => {
        if (!cancelled) setResources(data.resources || []);
      })
      .catch(() => {
        /* optional section — silence is fine */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, currentResourceId]);

  if (loaded && resources.length === 0) return null;

  return (
    <section ref={sectionRef} className="mt-8 border-t border-[var(--line)] pt-6 sm:mt-10 sm:pt-8">
      <div className="mb-3 sm:mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Pick up where you left off</p>
        <h2 className="font-serif-display mt-1 text-2xl italic text-[#1A1A1A] sm:text-3xl">recently viewed</h2>
      </div>
      {!loaded ? (
        <ShelfSkeleton />
      ) : (
        <>
          {/* Mobile: swipeable fixed-width row; 600px+: same grid as before. */}
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[600px]:mx-0 min-[600px]:grid min-[600px]:grid-cols-3 min-[600px]:gap-3 min-[600px]:overflow-x-visible min-[600px]:p-0 min-[600px]:snap-none xl:grid-cols-4">
            {resources.slice(0, 8).map((resource) => (
              <div
                key={resource._id}
                onClick={() => router.push(`/resource/${resource._id}`)}
                className="h-full w-[62%] max-w-[240px] shrink-0 cursor-pointer snap-start min-[600px]:w-full min-[600px]:max-w-none min-[600px]:shrink"
              >
                <ResourceCard
                  id={resource._id}
                  title={resource.title}
                  rating={resource.avgRating || 0}
                  reviewCount={resource.totalReviews || 0}
                  price={resource.price}
                  discount={resource.discount}
                  thumbnailUrl={resource.thumbnailUrl}
                  images={resource.images}
                  category={resource.category}
                  onGetResource={() => router.push(`/resource/${resource._id}`)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
