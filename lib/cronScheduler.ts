/**
 * Payment Capture Retry Scheduler
 * 
 * This module handles automatic retry of failed payment captures.
 * The retry schedule is:
 * - First attempt: Immediate (when payment is authorized)
 * - Second attempt: 2 hours after first failed attempt
 * - Third attempt: 4 hours after second failed attempt
 * - Maximum attempts: 3
 * - Maximum retry window: 24 hours from order creation
 * 
 * PRODUCTION SETUP:
 * 
 * For Vercel:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/payment-capture-retry",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * For other platforms:
 * 1. Set CRON_SECRET environment variable
 * 2. Configure cron job to call: GET /api/cron/payment-capture-retry
 * 3. Set Authorization header: Bearer {CRON_SECRET}
 * 4. Run every hour (0 * * * *)
 * 
 * Environment Variables:
 * - CRON_SECRET: Secret key to authenticate cron requests
 */

import { capturePayment, shouldRetryCapture } from './paymentCapture';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import { createAdminNotification } from './notifications';

export async function runPaymentCaptureRetryJob() {
  try {
    await connectDB();

    // Get all orders that need retry
    const orders = await Order.find({
      paymentCaptured: false,
      status: { $ne: 'failed' },
    }).sort({ createdAt: -1 });

    const results = {
      total: orders.length,
      retried: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      timestamp: new Date().toISOString(),
    };

    for (const order of orders) {
      const shouldRetry = await shouldRetryCapture(order);
      
      if (!shouldRetry) {
        results.skipped++;
        continue;
      }

      results.retried++;
      const result = await capturePayment(order.cashfreeOrderId);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;

        // Notify admins when a capture keeps failing so it can be resolved manually.
        try {
          await createAdminNotification({
            type: 'capture_failed',
            title: 'Payment capture failed',
            message: `Order ${order.cashfreeOrderId} — ${result.error || 'capture failed'}`,
            link: '/admin/payment-captures',
          });
        } catch (error) {
          console.error('Failed to create capture failure notification:', error);
        }
      }
    }

    console.log('Payment capture retry job completed:', results);
    return results;
  } catch (error) {
    console.error('Payment capture retry job error:', error);
    throw error;
  }
}

// Manual trigger for testing
export async function manualRetry() {
  return runPaymentCaptureRetryJob();
}
