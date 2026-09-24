import mongoose, { Schema, Model } from 'mongoose';

interface IReview {
  resourceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    resourceId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      // Optional: a rating-only review (e.g. from the quick rating popup) is valid.
      type: String,
      required: false,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Force model recompilation to pick up schema changes (comment became optional)
delete (mongoose.models as any).Review;
delete (mongoose.connection.models as any).Review;

const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
