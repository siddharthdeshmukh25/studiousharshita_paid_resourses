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

/** The only official contact address across the whole site. */
export const CONTACT_EMAIL = 'support@studiousharshita.com';

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

export const SOCIAL_PROFILES = [
  'https://www.instagram.com/studious_harshita',
  'https://youtube.com/@studious_harshita',
  'https://www.linkedin.com/in/siddharth-deshmukh2028',
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

export const DEFAULT_OG_IMAGE = '/favicon.svg';
