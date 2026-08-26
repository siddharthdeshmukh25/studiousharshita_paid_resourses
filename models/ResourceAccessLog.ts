import mongoose, { Model, Schema } from 'mongoose';

interface IResourceAccessLog {
  resourceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  openedAt: Date;
  source?: string;
}

const ResourceAccessLogSchema = new Schema<IResourceAccessLog>({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  openedAt: { type: Date, default: Date.now, index: true },
  source: { type: String, default: 'direct', trim: true, maxlength: 80 },
});

ResourceAccessLogSchema.index({ resourceId: 1, userId: 1, openedAt: -1 });

const ResourceAccessLog: Model<IResourceAccessLog> = mongoose.models.ResourceAccessLog || mongoose.model<IResourceAccessLog>('ResourceAccessLog', ResourceAccessLogSchema);

export default ResourceAccessLog;
