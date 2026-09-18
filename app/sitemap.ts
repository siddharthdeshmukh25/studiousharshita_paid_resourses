import type { MetadataRoute } from 'next';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import { GUIDES } from '@/lib/guides';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/resources', changeFrequency: 'daily', priority: 0.9 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refund-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/shipping-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  entries.push(
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: new Date(guide.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

  // Resource pages come from the database. If the DB is unreachable (e.g. during a
  // build without env vars) we still ship a valid sitemap instead of failing the build.
  try {
    await connectDB();
    const resources = await Resource.find({}).select('_id updatedAt').lean<{ _id: { toString(): string }; updatedAt?: Date }[]>();

    entries.push(
      ...resources.map((resource) => ({
        url: `${SITE_URL}/resource/${resource._id.toString()}`,
        lastModified: resource.updatedAt ?? now,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    );
  } catch (error) {
    console.error('Sitemap: unable to load resources, serving static routes only.', error);
  }

  return entries;
}
