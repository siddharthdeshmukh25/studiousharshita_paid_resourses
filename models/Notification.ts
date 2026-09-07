import mongoose, { Schema, Model } from 'mongoose';

interface INotification {
  type:
    | 'new_order'
    | 'payment_failed'
    | 'new_ticket'
    | 'ticket_reply'
    | 'new_contact'
    | 'capture_failed'
    | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: [
        'new_order',
        'payment_failed',
        'new_ticket',
        'ticket_reply',
        'new_contact',
        'capture_failed',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ read: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;