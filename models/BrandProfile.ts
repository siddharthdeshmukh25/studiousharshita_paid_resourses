import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose';

/**
 * Singleton brand-profile document (key: 'brand').
 * Everything the admin can edit from /admin/profile without touching code:
 * portrait photo, section copy, social links, contact inboxes and the
 * homepage stats. Public consumers fall back to lib/site.ts defaults, so an
 * empty/missing document never breaks the site.
 */
const BrandProfileSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'brand' },

    /** Flips true on the first admin save — from then on, empty fields mean
     *  "intentionally hidden", not "fall back to the shipped default". */
    isConfigured: { type: Boolean, default: false },

    /** Portrait shown in the homepage "Hi, I'm Harshita" section. Empty = text-card fallback. */
    photoUrl: { type: String, default: '' },

    /** Homepage About-section copy. */
    eyebrow: { type: String, default: '' },
    headline: { type: String, default: '' },
    tagline: { type: String, default: '' },
    bio: { type: String, default: '' },
    portraitCaption: { type: String, default: '' },

    /** Social profile URLs (empty string = hide the link). */
    socials: {
      instagram: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      facebook: { type: String, default: '' },
      threads: { type: String, default: '' },
      youtube: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      snapchat: { type: String, default: '' },
    },

    /** Contact inboxes shown in the footer. */
    emails: {
      support: { type: String, default: '' },
      contact: { type: String, default: '' },
      brand: { type: String, default: '' },
    },

    /** Homepage stat cards — value + label pairs, capped to keep layout sane. */
    stats: [
      {
        _id: false,
        value: { type: String, default: '' },
        label: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true, collection: 'brandprofile', minimize: false }
);

export type BrandProfileDoc = InferSchemaType<typeof BrandProfileSchema>;

export const BrandProfile: Model<BrandProfileDoc> =
  (mongoose.models.BrandProfile as Model<BrandProfileDoc>) ||
  mongoose.model<BrandProfileDoc>('BrandProfile', BrandProfileSchema);
