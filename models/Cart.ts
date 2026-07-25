import mongoose, { Schema, Model } from 'mongoose';

interface ICart {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
