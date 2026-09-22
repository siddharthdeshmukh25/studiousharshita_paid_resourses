'use client';

import { useEffect, useState } from 'react';

/**
 * Brand-profile data layer.
 *
 * lib/site.ts constants remain the single source of truth for SEO/schema and
 * act as the defaults here; the BrandProfile DB document (edited from
 * /admin/profile) overrides the display-only surfaces: footer socials/emails
 * and the homepage About section (photo, copy, stats).
 */

export const BRAND_PROFILE_DEFAULTS = {
  photoUrl: '',
  eyebrow: 'the girl behind the notes',
  headline: "Hi, I'm Harshita.",
  tagline: 'student · creator · maker',
  bio: "I'm a student and content creator building Studious Harshita as a space for ambitious students who want to learn, create and grow. What started as messy notebooks shared with friends is now a small library of exam-ready notes, planners and tools.",
  portraitCaption: "that's me → keeping it real since day one",
  socials: {
    instagram: 'https://www.instagram.com/studious_harshita',
    tiktok: 'https://www.tiktok.com/@studious_harshita',
    facebook: 'https://www.facebook.com/studiousharshita',
    threads: 'https://www.threads.net/@studious_harshita',
    youtube: 'https://youtube.com/@studious_harshita',
    pinterest: 'https://www.pinterest.com/studiousharshita',
    linkedin: 'https://www.linkedin.com/in/siddharth-deshmukh2028',
    snapchat: 'https://www.snapchat.com/add/studious_harshita',
  },
  emails: {
    support: 'support@studiousharshita.com',
    contact: 'contact@studiousharshita.com',
    brand: 'studiousharshita@gmail.com',
  },
  stats: [
    { value: '30K+', label: 'community' },
    { value: '2M+', label: 'monthly reach' },
    { value: '', label: 'students here' }, // value injected from /api/stats at render time
    { value: 'global', label: 'student audience' },
  ],
} as const;

export type BrandProfileSocials = Record<keyof typeof BRAND_PROFILE_DEFAULTS.socials, string>;
export type BrandProfileEmails = Record<keyof typeof BRAND_PROFILE_DEFAULTS.emails, string>;
export type BrandProfileStat = { value: string; label: string };

export type BrandProfileData = {
  photoUrl: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  bio: string;
  portraitCaption: string;
  socials: BrandProfileSocials;
  emails: BrandProfileEmails;
  stats: BrandProfileStat[];
  /** True once the admin has saved at least once — then empty fields are
   *  intentional (link hidden), not missing data to default-fill. */
  isConfigured: boolean;
};

/** DB doc (sparse) merged over the constants — every field always defined.
 *  Per-key fallback with ||: the stored doc often holds empty strings (e.g. a
 *  pre-fill save), and an empty value must fall back to the default instead of
 *  blanking the footer links / emails on the public site. */
export function mergeBrandProfile(raw: Partial<BrandProfileData> | null | undefined): BrandProfileData {
  const src = raw ?? {};
  // Before the first admin save the doc is sparse: empty fields fall back to
  // the shipped defaults so the footer never goes blank. After the admin has
  // saved once (isConfigured), their values — including deliberate empties —
  // win, because empty then means "hide this link".
  const useDefaults = !src.isConfigured;
  const pick = <K extends keyof BrandProfileSocials | keyof BrandProfileEmails>(
    group: 'socials' | 'emails',
    key: K
  ): string => {
    const stored = (src[group] as Record<string, string> | undefined)?.[key as string] ?? '';
    if (stored) return stored;
    return useDefaults ? (BRAND_PROFILE_DEFAULTS[group] as Record<string, string>)[key as string] : '';
  };
  return {
    photoUrl: src.photoUrl || (useDefaults ? BRAND_PROFILE_DEFAULTS.photoUrl : ''),
    eyebrow: src.eyebrow || (useDefaults ? BRAND_PROFILE_DEFAULTS.eyebrow : ''),
    headline: src.headline || (useDefaults ? BRAND_PROFILE_DEFAULTS.headline : ''),
    tagline: src.tagline || (useDefaults ? BRAND_PROFILE_DEFAULTS.tagline : ''),
    bio: src.bio || (useDefaults ? BRAND_PROFILE_DEFAULTS.bio : ''),
    portraitCaption: src.portraitCaption || (useDefaults ? BRAND_PROFILE_DEFAULTS.portraitCaption : ''),
    socials: {
      instagram: pick('socials', 'instagram'),
      tiktok: pick('socials', 'tiktok'),
      facebook: pick('socials', 'facebook'),
      threads: pick('socials', 'threads'),
      youtube: pick('socials', 'youtube'),
      pinterest: pick('socials', 'pinterest'),
      linkedin: pick('socials', 'linkedin'),
      snapchat: pick('socials', 'snapchat'),
    },
    emails: {
      support: pick('emails', 'support'),
      contact: pick('emails', 'contact'),
      brand: pick('emails', 'brand'),
    },
    stats: src.stats?.length ? src.stats : [...BRAND_PROFILE_DEFAULTS.stats],
    isConfigured: Boolean(src.isConfigured),
  };
}

/**
 * Shared /api/brand-profile fetch — one request per page load, cached across
 * sections (same pattern as getStats in HomeSections).
 */
let profilePromise: Promise<BrandProfileData> | null = null;
function getBrandProfile() {
  if (!profilePromise) {
    profilePromise = fetch('/api/brand-profile')
      .then((res) => res.json() as Promise<{ profile?: Partial<BrandProfileData> }>)
      .then((data) => mergeBrandProfile(data.profile))
      .catch((error) => {
        console.error('Error fetching brand profile:', error);
        return mergeBrandProfile(null);
      });
  }
  return profilePromise;
}

export function useBrandProfile() {
  const [profile, setProfile] = useState<BrandProfileData>(() => mergeBrandProfile(null));

  useEffect(() => {
    let cancelled = false;
    getBrandProfile().then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
