import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentSettings extends Document {
  gateway: 'razorpay' | 'payu' | 'cashfree';
  environment: 'sandbox' | 'production';
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  payu: {
    key: string;
    salt: string;
  };
  cashfree: {
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
  };
  updatedAt: Date;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>({
  gateway: {
    type: String,
    enum: ['razorpay', 'payu', 'cashfree'],
    default: 'cashfree',
  },
  environment: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox',
  },
  razorpay: {
    keyId: { type: String, default: '' },
    keySecret: { type: String, default: '' },
    webhookSecret: { type: String, default: '' },
  },
  payu: {
    key: { type: String, default: '' },
    salt: { type: String, default: '' },
  },
  cashfree: {
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    webhookSecret: { type: String, default: '' },
  },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure only one document exists
PaymentSettingsSchema.pre('save', async function () {
  this.updatedAt = new Date();
  const count = await mongoose.models.PaymentSettings.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one payment settings document can exist');
  }
});

export default mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
