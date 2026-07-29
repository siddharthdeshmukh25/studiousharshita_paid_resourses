import mongoose, { Schema, Model } from 'mongoose';

interface IOrder {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  cashfreeOrderId: string;
  cashfreePaymentId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    cashfreeOrderId: { type: String, required: true, unique: true },
    cashfreePaymentId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
