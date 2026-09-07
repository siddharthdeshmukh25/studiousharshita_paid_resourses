import connectDB from '@/lib/db/mongodb';
import Notification from '@/models/Notification';

export type NotificationType =
  | 'new_order'
  | 'payment_failed'
  | 'new_ticket'
  | 'ticket_reply'
  | 'new_contact'
  | 'capture_failed'
  | 'system';

export interface AdminNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates an admin notification. Never throws — a notification failure must
 * never break the payment/support flow that triggered it.
 */
export async function createAdminNotification(input: AdminNotificationInput) {
  try {
    await connectDB();
    return await Notification.create({ ...input, read: false });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}