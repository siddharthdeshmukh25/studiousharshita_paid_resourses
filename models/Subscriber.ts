import mongoose, { Schema, Model } from 'mongoose';

interface ISubscriber {
  email: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One subscription record per email address.
SubscriberSchema.index({ email: 1 }, { unique: true });

// Prevent model recompilation in development
const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
