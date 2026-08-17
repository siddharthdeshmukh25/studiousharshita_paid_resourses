import mongoose, { Schema, Model } from 'mongoose';

interface IUser {
  name: string;
  email: string;
  image?: string;
  role: 'user' | 'admin';
  purchasedResources: mongoose.Types.ObjectId[];
  googleDriveConnected?: boolean;
  googleDriveAccessToken?: string;
  googleDriveRefreshToken?: string;
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
    googleDriveAccessToken: {
      type: String,
    },
    googleDriveRefreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
