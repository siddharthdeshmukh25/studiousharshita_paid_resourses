import mongoose, { Schema, Model } from 'mongoose';

export interface IReferral {
  referrerId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  type: 'click' | 'sale';
  /** Our internal checkout order id (sales only). Used to look up the real Order status. */
  orderRef?: string;
  buyerId?: mongoose.Types.ObjectId;
  saleAmount?: number;
  commissionPercent?: number;
  commissionAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    type: { type: String, enum: ['click', 'sale'], required: true },
    orderRef: { type: String, index: true, sparse: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
    saleAmount: { type: Number, min: 0 },
    commissionPercent: { type: Number, min: 0, max: 100 },
    commissionAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Keep populated refs in sync with hot-reloaded models during development.
if (mongoose.models.Referral) mongoose.deleteModel('Referral');
const Referral: Model<IReferral> = mongoose.model<IReferral>('Referral', ReferralSchema);

export default Referral;
