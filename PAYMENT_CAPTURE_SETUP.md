# Payment Capture Auto-Retry System

## Overview

This system automatically handles payment capture with intelligent retry logic and admin notifications.

## Features

1. **Auto-Capture**: Payments are automatically captured after authorization
2. **Smart Retry**: Failed captures are retried at 2h and 4h intervals
3. **Admin Dashboard**: Monitor failed/pending captures and retry manually
4. **Webhook Integration**: Real-time payment status updates from payment gateways
5. **Comprehensive Tracking**: Track capture attempts, failures, and success rates

## How It Works

### Payment Flow

1. User initiates payment → Order created with `captureStatus: 'pending'`
2. Payment authorized → Webhook triggers auto-capture attempt
3. If capture fails → System marks as `captureStatus: 'failed'`
4. Cron job runs every hour → Checks for eligible retries
5. Retry schedule:
   - 1st attempt: Immediate (via webhook)
   - 2nd attempt: 2 hours after 1st failure
   - 3rd attempt: 4 hours after 2nd failure
   - Max retry window: 24 hours from order creation

### Backend Data

Order model now includes:
- `paymentCaptured`: Boolean - Whether payment was successfully captured
- `captureStatus`: 'pending' | 'success' | 'failed'
- `captureAttempts`: Array of timestamps for each attempt
- `lastCaptureAttempt`: Timestamp of most recent attempt
- `captureFailureReason`: Error message if capture failed
- `gateway`: 'razorpay' | 'cashfree'

## Setup Instructions

### 1. Configure Payment Gateway Webhooks

#### Razorpay

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add new webhook with URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
4. Copy the webhook secret
5. Add to admin panel: Settings → Payment → Razorpay → Webhook Secret

#### Cashfree

1. Go to Cashfree Dashboard → Settings → Webhooks
2. Add new webhook with URL: `https://yourdomain.com/api/webhooks/cashfree`
3. Select events:
   - `PAYMENT_SUCCESS`
   - `PAYMENT_FAILED`
   - `PAYMENT_PENDING`
   - `ORDER_SUCCESS`
   - `ORDER_FAILED`
4. Copy the webhook secret
5. Add to admin panel: Settings → Payment → Cashfree → Webhook Secret

### 2. Set Up Cron Job

#### For Vercel

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/payment-capture-retry",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### For Other Platforms

1. Set environment variable: `CRON_SECRET=your-secret-key`
2. Configure cron job to run hourly:
   ```
   0 * * * * curl -H "Authorization: Bearer your-secret-key" https://yourdomain.com/api/cron/payment-capture-retry
   ```

### 3. Environment Variables

Add these to your `.env` file:

```env
CRON_SECRET=your-super-secret-cron-key
```

## Admin Dashboard Usage

### Access Payment Capture Status

1. Go to Admin Dashboard
2. Click Settings icon (top right)
3. Click "Payment Captures"

### Monitor Captures

- **Failed Captures**: Red cards showing failed payment captures with error details
- **Pending Captures**: Yellow cards showing payments awaiting capture
- Each card shows:
  - Resource name
  - Order ID
  - User email
  - Amount
  - Error reason (for failed)
  - Number of attempts

### Manual Actions

- **Retry Single**: Click "Retry" button on any capture card
- **Batch Retry**: Click "Batch Retry All" to retry all eligible captures
- **Refresh**: Click "Refresh" to update the status list

## API Endpoints

### Webhook Endpoints

- `POST /api/webhooks/razorpay` - Razorpay webhook handler
- `POST /api/webhooks/cashfree` - Cashfree webhook handler

### Admin Endpoints

- `GET /api/admin/payment-captures?type=failed` - Get failed captures
- `GET /api/admin/payment-captures?type=pending` - Get pending captures
- `POST /api/admin/payment-captures` - Retry single capture
- `POST /api/admin/payment-captures/retry` - Batch retry all captures

### Cron Endpoint

- `GET /api/cron/payment-capture-retry` - Automated retry job (requires auth)

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct and publicly accessible
2. Verify webhook secret is correctly configured
3. Check payment gateway dashboard for webhook delivery logs
4. Ensure your server allows incoming requests from payment gateway IPs

### Captures Not Retrying

1. Verify cron job is running correctly
2. Check `CRON_SECRET` environment variable is set
3. Review server logs for cron job execution
4. Ensure orders are within 24-hour retry window

### Payment Shows as Pending

1. Check if webhook was received (server logs)
2. Verify payment gateway shows payment as authorized
3. Try manual retry from admin dashboard
4. Check if payment gateway has any issues

## Security Notes

1. **Webhook Secrets**: Never commit webhook secrets to version control
2. **Cron Secret**: Use a strong, random secret for cron authentication
3. **HTTPS**: Always use HTTPS for webhook URLs in production
4. **IP Whitelisting**: Consider whitelisting payment gateway IPs

## Monitoring & Alerts

Currently, the system logs all capture attempts. For production:

1. Set up log aggregation (e.g., Sentry, LogRocket)
2. Configure alerts for repeated capture failures
3. Monitor webhook delivery rates
4. Track capture success rates

## Future Enhancements

Potential improvements:
- Email notifications to admin for failed captures
- SMS alerts for critical failures
- Dashboard analytics and charts
- Automatic refund initiation for permanently failed captures
- Integration with monitoring services (Pingdom, UptimeRobot)
