import type { Metadata } from 'next';
import { cache } from 'react';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import Review from '@/models/Review';
import { SITE_NAME, SITE_URL } from '@/lib/site';

type ResourceSeoData = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  category: string;
  averageRating: number;
  reviewCount: number;
};

const getResourceSeoData = cache(async (id: string): Promise<ResourceSeoData | null> => {
  try {
    await connectDB();

    const resource = await Resource.findById(id)
      .select('title description thumbnailUrl price category')
      .lean<{
        _id: { toString(): string };
        title: string;
        description: string;
        thumbnailUrl: string;
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
      images: [{ url: resource.thumbnailUrl, alt: resource.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.title,
      description: resource.description,
      images: [resource.thumbnailUrl],
    },
  };
}

export default async function ResourceLayout({ children, params }: ResourceLayoutProps) {
  const { id } = await params;
  const resource = await getResourceSeoData(id);
  const baseUrl = SITE_URL;

  const productSchema = resource
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: resource.title,
        description: resource.description,
        image: resource.thumbnailUrl,
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
