import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import PaymentSettings from '@/models/PaymentSettings';

interface CaptureResult {
  success: boolean;
  error?: string;
  paymentId?: string;
}

// Razorpay capture functions
function razorpayBaseUrl() {
  return 'https://api.razorpay.com/v1';
}

function razorpayHeaders(settings: any) {
  const razorpayConfig = settings?.razorpay || {};
  const keyId = razorpayConfig.keyId;
  const keySecret = razorpayConfig.keySecret;

  console.log('Razorpay config:', { 
    keyId: keyId ? '***' + keyId.slice(-4) : 'missing', 
    keySecret: keySecret ? '***' + keySecret.slice(-4) : 'missing' 
  });

  if (!keyId || !keySecret) {
    console.error('❌ Razorpay credentials missing');
    return null;
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  console.log('✅ Auth token generated successfully');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
  };
}

async function getPaymentIdFromRazorpay(razorpayOrderId: string): Promise<string | null> {
  try {
    const settings = await PaymentSettings.findOne();
    if (!settings?.razorpay?.keyId || !settings?.razorpay?.keySecret) {
      console.error('❌ Razorpay not configured');
      return null;
    }

    const headers = razorpayHeaders(settings);
    if (!headers) {
      return null;
    }

    console.log('🔍 Fetching payment ID from Razorpay for order:', razorpayOrderId);
    const response = await fetch(`${razorpayBaseUrl()}/orders/${razorpayOrderId}/payments`, {
      method: 'GET',
      headers: headers,
    });

    const data = await response.json();
    console.log('Razorpay API response:', { status: response.status, data });
    
    if (!response.ok || !data.count || data.items.length === 0) {
      console.error('❌ No payments found for Razorpay order:', razorpayOrderId);
      return null;
    }

    const payment = data.items[0];
    console.log('✅ Payment found:', { id: payment.id, status: payment.status });
    return payment.id;
  } catch (error) {
    console.error('❌ Error fetching Razorpay payment ID:', error);
    return null;
  }
}

async function captureRazorpayPayment(paymentId: string, amount: number): Promise<CaptureResult> {
  try {
    const settings = await PaymentSettings.findOne();
    if (!settings?.razorpay?.keyId || !settings?.razorpay?.keySecret) {
      return { success: false, error: 'Razorpay not configured' };
    }

    const headers = razorpayHeaders(settings);
    if (!headers) {
      return { success: false, error: 'Failed to generate Razorpay headers' };
    }

    console.log('🔄 Attempting to capture payment:', paymentId);
    const response = await fetch(`${razorpayBaseUrl()}/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
      }),
    });

    const data = await response.json();
    console.log('Capture response:', { status: response.status, data });
    
    if (!response.ok) {
      console.error('❌ Capture failed:', data);
      return { success: false, error: data.error?.description || 'Capture failed' };
    }

    console.log('✅ Payment captured successfully');
    return { success: true, paymentId: data.id };
  } catch (error) {
    console.error('❌ Razorpay capture error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function capturePayment(orderId: string): Promise<CaptureResult> {
  await connectDB();
  
  console.log('🔍 Starting payment capture for order:', orderId);
  
  // First try to find order by custom order ID
  let order = await Order.findOne({ cashfreeOrderId: orderId });
  
  if (!order) {
    console.error('❌ Order not found with custom order ID:', orderId);
    return { success: false, error: 'Order not found' };
  }

  if (order.paymentCaptured || order.captureStatus === 'success') {
    console.log('✅ Payment already captured');
    return { success: true, error: 'Payment already captured' };
  }

  const settings = await PaymentSettings.findOne();
  if (!settings || !settings.gateway) {
    return { success: false, error: 'Payment gateway not configured' };
  }

  if (settings.gateway !== 'razorpay') {
    return { success: false, error: 'Only Razorpay gateway is supported' };
  }

  // Use the stored Razorpay order ID if available
  const razorpayOrderId = order.razorpayOrderId;
  if (!razorpayOrderId) {
    console.error('❌ No Razorpay order ID stored in order');
    return { success: false, error: 'Razorpay order ID not found in order' };
  }

  console.log('📋 Using stored Razorpay order ID:', razorpayOrderId);

  // Get the payment ID from Razorpay
  const paymentId = await getPaymentIdFromRazorpay(razorpayOrderId);
  if (!paymentId) {
    return { success: false, error: 'Payment ID not found in Razorpay' };
  }

  // Attempt capture
  const result = await captureRazorpayPayment(paymentId, order.amount);

  // Update order with capture attempt
  const updateData: any = {
    lastCaptureAttempt: new Date(),
    $push: { captureAttempts: new Date() },
  };

  if (result.success) {
    updateData.paymentCaptured = true;
    updateData.captureStatus = 'success';
    updateData.cashfreePaymentId = result.paymentId;
    updateData.status = 'completed';
    console.log('✅ Order updated with successful capture');
  } else {
    updateData.captureStatus = 'failed';
    updateData.captureFailureReason = result.error;
    console.log('❌ Order updated with failed capture');
  }

  await Order.updateOne({ cashfreeOrderId: orderId }, updateData);

  return result;
}

export async function shouldRetryCapture(order: any): Promise<boolean> {
  if (order.paymentCaptured || order.captureStatus === 'success') {
    return false;
  }

  const captureAttempts = order.captureAttempts || [];
  const now = new Date();
  const orderAge = now.getTime() - new Date(order.createdAt).getTime();
  const maxRetryHours = 24; // Don't retry after 24 hours

  if (orderAge > maxRetryHours * 60 * 60 * 1000) {
    return false;
  }

  // Retry schedule: 2 hours, then 4 hours after first attempt
  if (captureAttempts.length === 0) {
    return true; // First attempt can be done immediately
  }

  if (captureAttempts.length === 1) {
    const firstAttempt = new Date(captureAttempts[0]);
    const timeSinceFirstAttempt = now.getTime() - firstAttempt.getTime();
    return timeSinceFirstAttempt >= 2 * 60 * 60 * 1000; // 2 hours
  }

  if (captureAttempts.length === 2) {
    const secondAttempt = new Date(captureAttempts[1]);
    const timeSinceSecondAttempt = now.getTime() - secondAttempt.getTime();
    return timeSinceSecondAttempt >= 4 * 60 * 60 * 1000; // 4 hours
  }

  return false; // Max 3 attempts
}

export async function getFailedCaptures(limit: number = 50): Promise<any[]> {
  await connectDB();
  
  console.log('🔍 Fetching failed captures with Razorpay order IDs');
  const orders = await Order.find({
    paymentCaptured: false,
    captureStatus: 'failed',
    status: { $ne: 'failed' },
    razorpayOrderId: { $exists: true, $ne: null } // Only fetch orders with Razorpay order IDs
  })
  .sort({ lastCaptureAttempt: -1 })
  .limit(limit)
  .populate('userId', 'name email')
  .populate('resourceId', 'title');

  console.log(`✅ Found ${orders.length} failed captures`);
  return orders;
}

export async function getPendingCaptures(limit: number = 50): Promise<any[]> {
  await connectDB();
  
  console.log('🔍 Fetching pending captures with Razorpay order IDs');
  const orders = await Order.find({
    paymentCaptured: false,
    captureStatus: 'pending',
    status: 'pending',
    razorpayOrderId: { $exists: true, $ne: null } // Only fetch orders with Razorpay order IDs
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'name email')
  .populate('resourceId', 'title');

  console.log(`✅ Found ${orders.length} pending captures`);
  return orders;
}
