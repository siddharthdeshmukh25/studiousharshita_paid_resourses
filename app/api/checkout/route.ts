import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import PaymentSettings from '@/models/PaymentSettings';
import GoogleDriveCredentials from '@/models/GoogleDriveCredentials';
import { getValidCoupon } from '@/lib/coupons';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { grantFilePermission } from '@/lib/drive/googleDrive';

async function getPaymentSettings() {
  await connectDB();
  const settings = await PaymentSettings.findOne();
  return settings;
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return User.findById(session.user.id);
}

// Razorpay functions
function razorpayBaseUrl() {
  return 'https://api.razorpay.com/v1';
}

function razorpayHeaders(settings: any) {
  const razorpayConfig = settings?.razorpay || {};
  const keyId = razorpayConfig.keyId;
  const keySecret = razorpayConfig.keySecret;

  console.log('Razorpay config:', { keyId: keyId ? '***' : 'missing', keySecret: keySecret ? '***' : 'missing' });

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
  };
}

// Cashfree functions
function cashfreeBaseUrl(settings: any) {
  const environment = settings?.environment || 'sandbox';
  return environment === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';
}

function cashfreeHeaders(settings: any) {
  const cashfreeConfig = settings?.cashfree || {};
  const clientId = cashfreeConfig.clientId;
  const clientSecret = cashfreeConfig.clientSecret;

  console.log('Cashfree config:', { clientId: clientId ? '***' : 'missing', clientSecret: clientSecret ? '***' : 'missing' });

  return {
    'Content-Type': 'application/json',
    'x-api-version': '2025-01-01',
    'x-client-id': clientId || '',
    'x-client-secret': clientSecret || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const settings = await getPaymentSettings();
    if (!settings || !settings.gateway) {
      console.error('Payment settings not configured:', settings);
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const body = await request.json() as { resourceId?: string; couponCode?: string };
    console.log('Checkout request body:', body);
    if (!body.resourceId) {
      return NextResponse.json({ error: 'Resource ID is required.' }, { status: 400 });
    }

    await connectDB();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });

    console.log('Looking for resource with ID:', body.resourceId);
    const resource = await Resource.findById(body.resourceId);
    console.log('Found resource:', resource);
    if (!resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    if (resource.price === 0) return NextResponse.json({ error: 'This is a free resource. Open it directly from its page.' }, { status: 400 });
    if (user.purchasedResources.some((item) => item.toString() === resource._id.toString())) {
      return NextResponse.json({ error: 'You have already purchased this resource.' }, { status: 400 });
    }

    const resourceAmount = resource.discount && resource.discount > 0
      ? Number((resource.price * (1 - resource.discount / 100)).toFixed(2))
      : resource.price;
    const coupon = body.couponCode ? await getValidCoupon(body.couponCode, resourceAmount) : null;
    if (body.couponCode && !coupon) {
      return NextResponse.json({ error: 'This coupon is invalid, expired, or does not meet the minimum purchase requirement.' }, { status: 400 });
    }
    const amount = coupon
      ? Number((resourceAmount * (1 - coupon.discountPercentage / 100)).toFixed(2))
      : resourceAmount;

    // Ensure minimum price of ₹1 for payment gateway compatibility
    const MINIMUM_PRICE = 1;
    if (amount < MINIMUM_PRICE) {
      return NextResponse.json({ 
        error: `Final price cannot be less than ₹${MINIMUM_PRICE}. Please use a smaller discount or increase the resource price.` 
      }, { status: 400 });
    }

    const orderId = `${settings.gateway}_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const returnUrl = `${request.nextUrl.origin}/payment/return?order_id={order_id}`;

    let paymentResponse;
    let paymentSessionId;
    let razorpayOrderId; // Store actual Razorpay order ID

    if (settings.gateway === 'razorpay') {
      // Razorpay checkout
      const razorpayResponse = await fetch(`${razorpayBaseUrl()}/orders`, {
        method: 'POST',
        headers: razorpayHeaders(settings),
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: 'INR',
          receipt: orderId,
          notes: {
            userId: user._id.toString(),
            resourceId: resource._id.toString(),
            resourceTitle: resource.title,
            customOrderId: orderId, // Store our custom order ID in notes
          },
        }),
      });
      paymentResponse = await razorpayResponse.json();
      if (!razorpayResponse.ok || !paymentResponse.id) {
        console.error('Razorpay order creation failed:', paymentResponse);
        return NextResponse.json({ error: paymentResponse.error?.description || 'Razorpay could not create the payment order.' }, { status: 502 });
      }
      paymentSessionId = paymentResponse.id;
      razorpayOrderId = paymentResponse.id; // Store actual Razorpay order ID
    } else if (settings.gateway === 'cashfree') {
      // Cashfree checkout
      const cashfreeResponse = await fetch(`${cashfreeBaseUrl(settings)}/orders`, {
        method: 'POST',
        headers: { ...cashfreeHeaders(settings), 'x-idempotency-key': randomUUID() },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: user._id.toString(),
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: '9999999999', // Default phone - in production, collect from user during signup
          },
          order_meta: { 
            return_url: returnUrl,
            payment_methods: 'cc,dc,upi'
          },
          order_note: `Purchase: ${resource.title}`,
          // Add custom metadata for webhook
          order_tags: {
            userId: user._id.toString(),
            resourceId: resource._id.toString(),
            resourceTitle: resource.title,
          },
        }),
      });
      paymentResponse = await cashfreeResponse.json();
      if (!cashfreeResponse.ok || !paymentResponse.payment_session_id) {
        console.error('Cashfree order creation failed:', paymentResponse);
        return NextResponse.json({ error: paymentResponse.message || 'Cashfree could not create the payment order.' }, { status: 502 });
      }
      paymentSessionId = paymentResponse.payment_session_id;
    } else {
      return NextResponse.json({ error: 'Payment gateway not supported yet.' }, { status: 400 });
    }

    // Note: Order will be created only after successful payment via webhook
    // This prevents creating orders for failed/abandoned payments

    const responseData: any = {
      paymentSessionId,
      gateway: settings.gateway,
      environment: settings.environment || 'sandbox',
      orderId,
      amount,
      resourceTitle: resource.title,
      resourceId: resource._id.toString(),
    };

    // Add keyId and actual Razorpay order ID for frontend
    if (settings.gateway === 'razorpay') {
      responseData.keyId = settings.razorpay.keyId;
      responseData.razorpayOrderId = razorpayOrderId; // Add actual Razorpay order ID
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create the payment order.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { orderId?: string; razorpayOrderId?: string; skipVerification?: boolean };
    if (!body.orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });

    await connectDB();
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    
    // Get session for admin email
    const session = await getServerSession(authOptions);

    const settings = await getPaymentSettings();
    if (!settings || !settings.gateway) {
      return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }

    // Check if order already exists
    let order = await Order.findOne({ cashfreeOrderId: body.orderId, userId: user._id });
    
    if (order && order.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Payment completed successfully' });
    }
    
    if (order && order.status === 'failed') {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment failed. Please try again or contact support.',
        reason: order.captureFailureReason 
      }, { status: 400 });
    }

    // Manual payment verification and capture
    if (settings.gateway === 'razorpay') {
      // First, try to find if we already have an order with this custom order ID
      let existingOrder = await Order.findOne({ cashfreeOrderId: body.orderId });
      
      // If we have an existing order with razorpayOrderId stored, use that
      let razorpayOrderIdToUse = existingOrder?.razorpayOrderId;
      
      // If razorpayOrderId is provided from frontend, use that
      if (body.razorpayOrderId) {
        razorpayOrderIdToUse = body.razorpayOrderId;
        console.log('Using Razorpay order ID from frontend:', razorpayOrderIdToUse);
      }
      
      // If not, we need to get payments using the custom order ID from notes
      if (!razorpayOrderIdToUse) {
        // Since we can't search by custom order ID in Razorpay, we need to find by receipt
        // We'll try to search recent orders or use a different approach
        console.log('No stored Razorpay order ID, attempting to find by receipt...');
        
        // Try to get payments by searching with the custom order ID as receipt
        // Razorpay doesn't support searching by receipt directly, so we need a different approach
        // For now, let's try to use the custom order ID directly (it might work if the format matches)
        const paymentsResponse = await fetch(`${razorpayBaseUrl()}/orders/${body.orderId}/payments`, {
          method: 'GET',
          headers: razorpayHeaders(settings),
        });

        const paymentsData = await paymentsResponse.json();
        
        if (paymentsResponse.ok && paymentsData.count && paymentsData.items.length > 0) {
          // It worked with custom order ID
          const payment = paymentsData.items[0];
          razorpayOrderIdToUse = payment.order_id; // This is the actual Razorpay order ID
        } else {
          return NextResponse.json({ 
            success: false, 
            error: 'Payment not found. The order ID may have expired or is invalid.' 
          }, { status: 404 });
        }
      }
      
      // Now get payment details using the actual Razorpay order ID
      const paymentsResponse = await fetch(`${razorpayBaseUrl()}/orders/${razorpayOrderIdToUse}/payments`, {
        method: 'GET',
        headers: razorpayHeaders(settings),
      });

      const paymentsData = await paymentsResponse.json();
      
      if (!paymentsResponse.ok || !paymentsData.count || paymentsData.items.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Payment not found or still processing.' 
        }, { status: 202 });
      }

      const payment = paymentsData.items[0];
      
      // Check if payment is authorized
      if (payment.status !== 'authorized' && payment.status !== 'captured') {
        return NextResponse.json({ 
          success: false, 
          error: `Payment status: ${payment.status}. Please wait or contact support.` 
        }, { status: 202 });
      }

      // Capture payment if not already captured
      if (payment.status === 'authorized') {
        console.log('Payment is authorized, attempting capture for payment ID:', payment.id);
        const captureResponse = await fetch(`${razorpayBaseUrl()}/payments/${payment.id}/capture`, {
          method: 'POST',
          headers: razorpayHeaders(settings),
          body: JSON.stringify({
            amount: payment.amount,
            currency: 'INR',
          }),
        });

        const captureData = await captureResponse.json();
        console.log('Capture response:', captureData);
        
        if (!captureResponse.ok) {
          console.error('Capture failed:', captureData);
          return NextResponse.json({ 
            success: false, 
            error: 'Payment capture failed. Please contact support.' 
          }, { status: 500 });
        }
        console.log('✅ Payment captured successfully');
      } else if (payment.status === 'captured') {
        console.log('✅ Payment already captured');
      }

      // Get notes from payment to extract userId and resourceId
      const notes = payment.notes;
      const userId = notes?.userId;
      const resourceId = notes?.resourceId;

      if (!userId || !resourceId) {
        return NextResponse.json({ error: 'Payment information incomplete.' }, { status: 400 });
      }

      // Create or update order
      if (!order) {
        order = await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: body.orderId,
          razorpayOrderId: razorpayOrderIdToUse, // Store actual Razorpay order ID
          cashfreePaymentId: payment.id,
          amount: payment.amount / 100,
          status: 'completed',
          gateway: 'razorpay',
          captureStatus: 'success',
          paymentCaptured: true,
        });
        console.log('Created new order with Razorpay order ID:', razorpayOrderIdToUse);
      } else {
        await Order.updateOne(
          { _id: order._id },
          { 
            status: 'completed',
            captureStatus: 'success',
            paymentCaptured: true,
            cashfreePaymentId: payment.id,
            razorpayOrderId: razorpayOrderIdToUse, // Update with actual Razorpay order ID
          }
        );
        console.log('Updated existing order with Razorpay order ID:', razorpayOrderIdToUse);
      }

      // Grant access to user
      const resource = await Resource.findById(resourceId);
      if (resource && !user.purchasedResources.includes(resource._id)) {
        console.log('Granting access to user:', user._id, 'for resource:', resourceId);
        user.purchasedResources.push(resource._id);
        await user.save();
        console.log('✅ Access granted successfully');
        
        // Grant Google Drive permission if resource is Google Drive
        if (resource.linkType === 'google_drive' || resource.linkType === 'docs') {
          try {
            console.log('Resource is Google Drive, granting permission to user:', user.email);
            
            // Find ANY user with valid Google Drive credentials (should be admin)
            const adminWithDrive = await GoogleDriveCredentials.findOne({});
            
            if (adminWithDrive) {
              console.log('Found admin with Google Drive credentials:', adminWithDrive.email);
              await grantFilePermission(resource.linkUrl, user.email, adminWithDrive.userId);
              console.log('✅ Google Drive permission granted successfully to:', user.email);
            } else {
              console.log('⚠️ No admin with Google Drive credentials found, skipping permission grant');
              console.log('Please ensure admin has connected Google Drive in settings');
            }
          } catch (error) {
            console.error('Error granting Google Drive permission:', error);
            // Don't fail the payment if permission grant fails
            console.log('⚠️ Payment successful but Google Drive permission grant failed');
          }
        }
      } else {
        console.log('User already has access to this resource or resource not found');
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment completed successfully',
        paymentId: payment.id 
      });
    } else if (settings.gateway === 'cashfree') {
      // Similar logic for Cashfree
      const paymentsResponse = await fetch(`${cashfreeBaseUrl(settings)}/orders/${body.orderId}/payments`, {
        method: 'GET',
        headers: cashfreeHeaders(settings),
      });

      const paymentsData = await paymentsResponse.json();
      
      if (!paymentsResponse.ok || !paymentsData.length || paymentsData[0].payment_status !== 'SUCCESS') {
        return NextResponse.json({ 
          success: false, 
          error: 'Payment not successful or still processing.' 
        }, { status: 202 });
      }

      const payment = paymentsData[0];
      const userId = payment.order_tags?.userId;
      const resourceId = payment.order_tags?.resourceId;

      if (!userId || !resourceId) {
        return NextResponse.json({ error: 'Payment information incomplete.' }, { status: 400 });
      }

      // Create or update order
      if (!order) {
        order = await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: body.orderId,
          cashfreePaymentId: payment.cf_payment_id,
          amount: payment.order_amount,
          status: 'completed',
          gateway: 'cashfree',
          captureStatus: 'success',
          paymentCaptured: true,
        });
      } else {
        await Order.updateOne(
          { _id: order._id },
          { 
            status: 'completed',
            captureStatus: 'success',
            paymentCaptured: true,
            cashfreePaymentId: payment.cf_payment_id,
          }
        );
      }

      // Grant access to user
      const resource = await Resource.findById(resourceId);
      if (resource && !user.purchasedResources.includes(resource._id)) {
        user.purchasedResources.push(resource._id);
        await user.save();
        
        // Grant Google Drive permission if resource is Google Drive
        if (resource.linkType === 'google_drive' || resource.linkType === 'docs') {
          try {
            console.log('Resource is Google Drive, granting permission to user:', user.email);
            
            // Find the admin user who has Google Drive connected
            // We need to find ANY user with valid Google Drive credentials
            const adminWithDrive = await GoogleDriveCredentials.findOne({});
            
            if (adminWithDrive) {
              console.log('Found admin with Google Drive credentials:', adminWithDrive.email);
              await grantFilePermission(resource.linkUrl, user.email, adminWithDrive.userId);
              console.log('✅ Google Drive permission granted successfully to:', user.email);
            } else {
              console.log('⚠️ No admin with Google Drive credentials found, skipping permission grant');
              console.log('Please ensure admin has connected Google Drive in settings');
            }
          } catch (error) {
            console.error('Error granting Google Drive permission:', error);
            console.log('⚠️ Payment successful but Google Drive permission grant failed');
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment completed successfully',
        paymentId: payment.cf_payment_id 
      });
    }

    return NextResponse.json({ error: 'Payment gateway not supported.' }, { status: 400 });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment status.' }, { status: 500 });
  }
}
