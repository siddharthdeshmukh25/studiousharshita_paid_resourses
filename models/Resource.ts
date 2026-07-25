import mongoose, { Schema, Model } from 'mongoose';

interface IResource {
  title: string;
  description: string;
  price: number;
  discount?: number;
  thumbnailUrl: string;
  linkType: 'google_drive' | 'notion' | 'docs';
  linkUrl: string;
  category: string;
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
    thumbnailUrl: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Resource: Model<IResource> = mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
