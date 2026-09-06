import mongoose, { Model, Schema } from 'mongoose';

interface IUserActivity {
  userId: mongoose.Types.ObjectId;
  action: 'page_view';
  path: string;
  timestamp: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['page_view'], default: 'page_view', required: true },
  path: { type: String, required: true, trim: true, maxlength: 300 },
  timestamp: { type: Date, default: Date.now, index: true },
});

UserActivitySchema.index({ userId: 1, timestamp: -1 });

const UserActivity: Model<IUserActivity> = mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);

export default UserActivity;
