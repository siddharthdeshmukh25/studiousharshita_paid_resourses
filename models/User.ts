import mongoose, { Schema, Model } from 'mongoose';

interface IUser {
  name: string;
  email: string;
  image?: string;
  role: 'user' | 'admin';
  purchasedResources: mongoose.Types.ObjectId[];
  googleDriveConnected?: boolean; // Kept for backward compatibility, now managed by GoogleDriveCredentials
  country?: string; // Country code (e.g., 'IN', 'US', 'UK')
  ipAddress?: string; // Last known IP address
  referralCode?: string; // Public code used in ?ref= share links
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    purchasedResources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    googleDriveConnected: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Referral-code fields can be added during development hot reload; replace the
// cached model so strict Mongoose updates use the current schema.
if (mongoose.models.User) mongoose.deleteModel('User');
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
