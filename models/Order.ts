import mongoose, { Schema, Model } from 'mongoose';

interface IOrder {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  cashfreeOrderId: string;
  razorpayOrderId?: string; // Store actual Razorpay order ID
  cashfreePaymentId?: string;
  amount: number;
  couponCode?: string;
  couponDiscountPercentage?: number;
  status: 'pending' | 'completed' | 'failed';
  paymentCaptured?: boolean;
  captureStatus?: 'pending' | 'success' | 'failed';
  captureAttempts?: Date[];
  lastCaptureAttempt?: Date;
  captureFailureReason?: string;
  gateway?: 'razorpay' | 'cashfree' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    cashfreeOrderId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String }, // Store actual Razorpay order ID
    cashfreePaymentId: { type: String },
    amount: { type: Number, required: true },
    couponCode: { type: String },
    couponDiscountPercentage: { type: Number, min: 0, max: 100 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentCaptured: { type: Boolean, default: false },
    captureStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    captureAttempts: { type: [Date], default: [] },
    lastCaptureAttempt: { type: Date },
    captureFailureReason: { type: String },
    gateway: { type: String, enum: ['razorpay', 'cashfree', 'manual'] },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
