import { NextRequest, NextResponse } from 'next/server';
import { runPaymentCaptureRetryJob } from '@/lib/cronScheduler';

// This endpoint should be called by a cron job every hour
// For Vercel, configure in vercel.json or use Vercel Cron Jobs
// For other platforms, use a cron service to call this endpoint

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by cron (add your authentication here)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runPaymentCaptureRetryJob();

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Payment capture retry job error:', error);
    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}
