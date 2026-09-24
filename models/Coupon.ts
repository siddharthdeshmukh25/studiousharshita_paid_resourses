import mongoose, { Model, Schema } from 'mongoose';

interface ICoupon {
  code: string;
  title: string;
  description?: string;
  expiresAt?: Date;
  discountType: 'percentage' | 'fixed';
  discountPercentage?: number;
  discountAmount?: number;
  minimumPurchaseAmount?: number;
  maxUsesPerUser?: number;
  maxTotalUses?: number;
  currentUses?: number;
  applicableCategories?: string[];
  applicableResources?: string[];
  isActive: boolean;
  /** Public coupons show in the home offers strip; private ones are checkout-only (DM-style). */
  isPublic: boolean;
  imageUrl?: string;
  imageTitle?: string;
  imageDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 200 },
    expiresAt: { type: Date },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountPercentage: { type: Number, min: 1, max: 100 },
    discountAmount: { type: Number, min: 0 },
    minimumPurchaseAmount: { type: Number, min: 0, default: 0 },
    maxUsesPerUser: { type: Number, min: 1, default: 1 },
    maxTotalUses: { type: Number, min: 1 },
    currentUses: { type: Number, default: 0 },
    applicableCategories: [{ type: String }],
    applicableResources: [{ type: Schema.Types.ObjectId, ref: 'Resource' }],
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    imageUrl: { type: String },
    imageTitle: { type: String, maxlength: 100 },
    imageDescription: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// Force model recompilation so schema changes (isPublic) are picked up even
// when the model was already registered by an earlier import this process.
delete (mongoose.models as any).Coupon;
delete (mongoose.connection.models as any).Coupon;

const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
