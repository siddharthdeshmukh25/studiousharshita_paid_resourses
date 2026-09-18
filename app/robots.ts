import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Routes that must never be indexed (private, transactional or admin-only). */
const DISALLOWED = [
  '/admin',
  '/admin/',
  '/api/',
  '/analytics',
  '/checkout',
  '/dashboard',
  '/payment',
  '/profile',
  '/wishlist',
  '/support/',
  '/*?type=',
];

/** AI assistants and answer engines we explicitly welcome, so our content can be cited. */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
