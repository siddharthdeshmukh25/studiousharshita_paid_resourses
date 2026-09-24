import type { Metadata } from 'next';
import { cache } from 'react';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, siteUrl } from '@/lib/site';

type ResourceSeoData = {
  id: string;
  title: string;
  description: string;
  images: string[];
  thumbnailUrl?: string;
  price: number;
  category: string;
  averageRating: number;
  reviewCount: number;
};

/** OG previews perform best at 1200x630 — WhatsApp/Telegram/Facebook's recommended size. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type OgImage = { url: string; width?: number; height?: number };

/**
 * Pick the best share image for a resource and make it crawler-friendly.
 * - Newer resources only fill images[]; older ones only thumbnailUrl, so try both.
 * - Cloudinary delivery URLs get a 1200x630 cover-crop transform injected so the
 *   preview always matches the recommended OG dimensions and loads fast
 *   (f_auto,q_auto). Idempotent: URLs that already carry transforms are untouched.
 * - Fall back to the site-wide OG image so a shared link never previews blank.
 */
function getResourceOgImage(resource: Pick<ResourceSeoData, 'images' | 'thumbnailUrl'>): OgImage {
  const raw = resource.images?.find(Boolean) ?? resource.thumbnailUrl ?? DEFAULT_OG_IMAGE;

  if (raw === DEFAULT_OG_IMAGE) {
    return { url: raw, width: OG_WIDTH, height: OG_HEIGHT };
  }

  if (/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(raw) && !/\/image\/upload\/(w_|h_|c_|q_|f_)/.test(raw)) {
    return {
      url: raw.replace('/image/upload/', `/image/upload/w_${OG_WIDTH},h_${OG_HEIGHT},c_fill,f_auto,q_auto/`),
      width: OG_WIDTH,
      height: OG_HEIGHT,
    };
  }

  return { url: raw };
}

const getResourceSeoData = cache(async (id: string): Promise<ResourceSeoData | null> => {
  try {
    await connectDB();

    const resource = await Resource.findById(id)
      .select('title description images thumbnailUrl price category')
      .lean<{
        _id: { toString(): string };
        title: string;
        description: string;
        images?: string[];
        thumbnailUrl?: string;
        price: number;
        category: string;
      } | null>();

    if (!resource) return null;

    const [ratings] = await Review.aggregate<{
      averageRating: number;
      reviewCount: number;
    }>([
      { $match: { resourceId: id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);

    return {
      id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      images: resource.images ?? [],
      thumbnailUrl: resource.thumbnailUrl,
      price: resource.price,
      category: resource.category,
      averageRating: ratings?.averageRating ?? 0,
      reviewCount: ratings?.reviewCount ?? 0,
    };
  } catch {
    return null;
  }
});

type ResourceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ResourceLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const resource = await getResourceSeoData(id);

  if (!resource) {
    return {
      title: 'Resource not found',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/resource/${resource.id}`;
  const ogImage = getResourceOgImage(resource);

  return {
    title: resource.title,
    description: resource.description,
    keywords: [resource.title, resource.category, 'study notes', 'digital study resources'],
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    other: { 'article:section': resource.category },
    openGraph: {
      type: 'website',
      url: canonicalPath,
      title: resource.title,
      description: resource.description,
      siteName: SITE_NAME,
      images: [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: resource.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.title,
      description: resource.description,
      images: [ogImage.url],
    },
  };
}

export default async function ResourceLayout({ children, params }: ResourceLayoutProps) {
  const { id } = await params;
  const resource = await getResourceSeoData(id);
  const baseUrl = SITE_URL;

  const ogImage = resource ? getResourceOgImage(resource) : null;
  const schemaImageUrl = ogImage ? (ogImage.url.startsWith('http') ? ogImage.url : siteUrl(ogImage.url)) : null;

  const productSchema = resource
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: resource.title,
        description: resource.description,
        image: schemaImageUrl,
        category: resource.category,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: resource.price,
          availability: 'https://schema.org/InStock',
          url: `${baseUrl}/resource/${resource.id}`,
        },
        ...(resource.reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(resource.averageRating.toFixed(1)),
                reviewCount: resource.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
