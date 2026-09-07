import mongoose, { Schema, Model } from 'mongoose';

export interface ISupportMessage {
  author: 'user' | 'admin';
  text: string;
  createdAt?: Date; // auto-added by the subdocument timestamps
}

interface ISupportTicket {
  userId: mongoose.Types.ObjectId;
  orderId?: string;
  source: 'support' | 'contact';
  category: 'payment' | 'access' | 'refund' | 'general' | 'project';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    author: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: true }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String },
    source: { type: String, enum: ['support', 'contact'], default: 'support' },
    category: {
      type: String,
      enum: ['payment', 'access', 'refund', 'general', 'project'],
      default: 'general',
    },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    messages: { type: [SupportMessageSchema], default: [] },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });

const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;