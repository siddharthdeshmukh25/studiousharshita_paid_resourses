import { NextRequest, NextResponse } from 'next/server';
import { runPaymentCaptureRetryJob } from '@/lib/cronScheduler';

// This endpoint should be called by a cron job every hour
// For Vercel, configure in vercel.json or use Vercel Cron Jobs
// For other platforms, use a cron service to call this endpoint

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by cron. Fail closed: never fall back to a
    // hardcoded secret that ships in the source code.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured. Set it in the environment before enabling the cron endpoint.' },
        { status: 500 }
      );
    }
    
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
