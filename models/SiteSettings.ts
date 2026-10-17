import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose';

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    theme: {
      preset: { type: String, enum: ['blue', 'green', 'custom'], default: 'blue' },
      customColor: { type: String, default: null },
    },
    referral: {
      enabled: { type: Boolean, default: true },
      defaultPercent: { type: Number, min: 0, max: 100, default: 10 },
    },
  },
  { timestamps: true, collection: 'sitesettings' }
);

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema>;

export const SiteSettings: Model<SiteSettingsDoc> =
  (mongoose.models.SiteSettings as Model<SiteSettingsDoc>) ||
  mongoose.model<SiteSettingsDoc>('SiteSettings', SiteSettingsSchema);
