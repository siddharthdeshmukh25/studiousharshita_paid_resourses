import mongoose, { Schema, Model } from 'mongoose';

interface IWishlist {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
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
const Wishlist: Model<IWishlist> = mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export default Wishlist;
