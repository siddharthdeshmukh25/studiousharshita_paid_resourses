import mongoose, { Schema, Model } from 'mongoose';

interface IUserAnalytics {
  userId: mongoose.Types.ObjectId;
  email: string;
  country?: string; // Country code (e.g., 'IN', 'US', 'UK')
  ipAddress?: string; // IP address
  action: 'signup' | 'login' | 'page_view' | 'purchase'; // Type of action
  timestamp: Date;
}

const UserAnalyticsSchema = new Schema<IUserAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      enum: ['signup', 'login', 'page_view', 'purchase'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserAnalyticsSchema.index({ userId: 1, timestamp: -1 });
UserAnalyticsSchema.index({ country: 1, timestamp: -1 });
UserAnalyticsSchema.index({ action: 1, timestamp: -1 });

// Prevent model recompilation in development
const UserAnalytics: Model<IUserAnalytics> = mongoose.models.UserAnalytics || mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);

export default UserAnalytics;
