'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResourceCard from '@/components/resource/ResourceCard';

interface RelatedResource {
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

/** One-color skeleton shelf that matches the resource page skeleton tone. */
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

/**
 * "You may also like" — same-category recommendations for the resource page.
 * Data comes from /api/resources/related/[id] which only returns public-safe
 * fields. Lazy: the fetch only fires when the user scrolls near this section
 * (IntersectionObserver), so the main content above loads first. Renders
 * nothing when there is nothing to recommend.
 */
export default function RelatedResources({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [related, setRelated] = useState<RelatedResource[]>([]);

  // Wait until the section is (nearly) in view before spending a request.
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
    if (!shouldLoad || loaded) return;
    let cancelled = false;
    setRelated([]);

    fetch(`/api/resources/related/${resourceId}`)
      .then((res) => res.json() as Promise<{ resources: RelatedResource[] }>)
      .then((data) => {
        if (!cancelled) setRelated(data.resources || []);
      })
      .catch(() => {
        /* recommendations are optional — silence is fine */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, loaded, resourceId]);

  if (loaded && related.length === 0) return null;

  return (
    <section ref={sectionRef} className="mt-6 border-t border-[var(--line)] pt-5 sm:mt-10 sm:pt-8">
      <div className="mb-3 sm:mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Keep going</p>
          <h2 className="font-serif-display mt-1 text-2xl italic text-[#1A1A1A] sm:text-3xl">you may also like</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push('/resources')}
          className="shrink-0 text-sm font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-deep)]"
        >
          Browse all →
        </button>
      </div>
      {!loaded ? (
        <ShelfSkeleton />
      ) : (
        <>
          {/* Mobile: swipeable row (cards keep a fixed width so they never squish);
              600px+: normal wrapping grid exactly as before. */}
          <div
            className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[600px]:mx-0 min-[600px]:grid min-[600px]:grid-cols-3 min-[600px]:gap-3 min-[600px]:overflow-x-visible min-[600px]:p-0 min-[600px]:snap-none xl:grid-cols-4"
          >
            {related.slice(0, 8).map((resource) => (
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
