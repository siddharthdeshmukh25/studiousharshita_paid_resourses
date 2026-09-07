import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose';

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    theme: {
      preset: { type: String, enum: ['blue', 'green', 'custom'], default: 'blue' },
      customColor: { type: String, default: null },
    },
  },
  { timestamps: true, collection: 'sitesettings' }
);

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema>;

export const SiteSettings: Model<SiteSettingsDoc> =
  (mongoose.models.SiteSettings as Model<SiteSettingsDoc>) ||
  mongoose.model<SiteSettingsDoc>('SiteSettings', SiteSettingsSchema);
