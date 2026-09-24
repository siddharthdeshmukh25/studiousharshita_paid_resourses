import mongoose, { Schema, Model } from 'mongoose';

interface ISubscriber {
  email: string;
  /** Where the signup came from (e.g. footer, lead_magnet_planner) — analytics only. */
  source?: string;
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
    source: {
      type: String,
      required: false,
      trim: true,
      maxlength: 60,
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
