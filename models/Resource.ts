import mongoose, { Schema, Model } from 'mongoose';

interface IResource {
  title: string;
  description: string;
  price: number;
  discount?: number;
  images?: string[];
  thumbnailUrl?: string;
  linkType: 'google_drive' | 'notion' | 'docs';
  linkUrl: string;
  category: string;
  /** Optional public preview link (Google Drive / Docs / Notion sample) — shown as a "Free sample" button before purchase. */
  sampleUrl?: string;
  /** Set when this resource is a bundle: the resources bundled inside it. Buying the bundle grants access to every child. */
  bundleResourceIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    images: {
      type: [String],
      required: false,
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 5;
        },
        message: 'Resource can have maximum 5 images',
      },
    },
    thumbnailUrl: {
      type: String,
      required: false,
    },
    linkType: {
      type: String,
      enum: ['google_drive', 'notion', 'docs'],
      required: true,
    },
    linkUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    sampleUrl: {
      type: String,
      required: false,
    },
    bundleResourceIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Resource',
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Force model recompilation to pick up schema changes
delete (mongoose.models as any).Resource;
delete (mongoose.connection.models as any).Resource;

const Resource: Model<IResource> = mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
