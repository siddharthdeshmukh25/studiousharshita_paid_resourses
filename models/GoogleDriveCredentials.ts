import mongoose, { Schema, Model } from 'mongoose';

interface IGoogleDriveCredentials {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  scope: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleDriveCredentialsSchema = new Schema<IGoogleDriveCredentials>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiry: {
      type: Date,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const GoogleDriveCredentials: Model<IGoogleDriveCredentials> = 
  mongoose.models.GoogleDriveCredentials || 
  mongoose.model<IGoogleDriveCredentials>('GoogleDriveCredentials', GoogleDriveCredentialsSchema);

export default GoogleDriveCredentials;
