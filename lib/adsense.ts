/**
 * Public AdSense configuration. The publisher ID is public and was supplied
 * by the site owner; each manually created AdSense unit needs its own slot ID.
 */
export const ADSENSE_PUBLISHER_ID = (
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-9013540088743372'
).trim();

export const ADSENSE_SLOTS = {
  freeResources: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_FREE_RESOURCES || '').trim(),
  freeDetailInline: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_INLINE || '').trim(),
  freeDetailLeft: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_LEFT || '').trim(),
  freeDetailRight: (process.env.NEXT_PUBLIC_ADSENSE_SLOT_FREE_DETAIL_RIGHT || '').trim(),
} as const;
