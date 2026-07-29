import mongoose, { Model, Schema } from 'mongoose';

interface ICoupon {
  code: string;
  title: string;
  expiresAt: Date;
  discountPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
