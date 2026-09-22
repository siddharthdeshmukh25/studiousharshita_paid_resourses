/**
 * Single source of truth for brand + business facts.
 * Metadata, JSON-LD schema, robots, sitemap and llms.txt all read from here so
 * the brand name, contact email and address can never drift apart again.
 */

export const SITE_URL = (process.env.NEXTAUTH_URL || 'https://resources.studiousharshita.com').replace(/\/+$/, '');

/** Brand name used in prose, titles, schema and legal pages. */
export const SITE_NAME = 'Studious Harshita';

/** Compact wordmark kept in the navbar/footer logo lockup. */
export const SITE_WORDMARK = 'studiousharshita';

/** Support inbox — order/access/payment/refund help (24–48 business hours). */
export const SUPPORT_EMAIL = 'support@studiousharshita.com';

/** General / normal queries that are not urgent support tickets. */
export const CONTACT_EMAIL = 'contact@studiousharshita.com';

/** Brand deals & collaborations inbox. */
export const BRAND_EMAIL = 'studiousharshita@gmail.com';

/** Legal entity / founder behind the platform. */
export const LEGAL_ENTITY = 'Harshita Pravinbhai Soni';

export const BUSINESS_ADDRESS = {
  street: 'Vyasvadi, Vadaj',
  city: 'Ahmedabad',
  region: 'Gujarat',
  postalCode: '380013',
  country: 'IN',
} as const;

export const BUSINESS_ADDRESS_TEXT = 'Vyasvadi, Vadaj, Ahmedabad, Gujarat, India - 380013';

/** Social profiles, in the client's requested display order.
 *  NOTE: TikTok, Facebook, Threads, Pinterest and Snapchat URLs follow the
 *  brand handle — verify each one once the official profile is live. */
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/studious_harshita',
  'https://www.tiktok.com/@studious_harshita',
  'https://www.facebook.com/studiousharshita',
  'https://www.threads.net/@studious_harshita',
  'https://youtube.com/@studious_harshita',
  'https://www.pinterest.com/studiousharshita',
  'https://www.linkedin.com/in/siddharth-deshmukh2028',
  'https://www.snapchat.com/add/studious_harshita',
];

export const DEFAULT_DESCRIPTION =
  'Study smarter with Studious Harshita — free study resources, premium study notes, planners, scholarship resources and AI tools for students across India.';

export const DEFAULT_KEYWORDS = [
  'Studious Harshita',
  'study resources for students',
  'free study resources',
  'AI tools for students',
  'student productivity',
  'Notion templates for students',
  'study planner',
  'scholarship resources',
  'premium study notes',
  'digital study materials',
  'exam study material',
  'study notes Ahmedabad',
  'student study guides',
];

export const siteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Real PNG (rendered by app/opengraph-image.tsx). Never point OG at an SVG —
 *  WhatsApp/Instagram scrapers ignore SVG and show a blank/generic icon. */
export const DEFAULT_OG_IMAGE = '/opengraph-image';
