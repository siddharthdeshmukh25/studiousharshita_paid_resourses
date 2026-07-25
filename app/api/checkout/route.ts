import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Calculate final price with discount
    const finalPrice = resource.discount && resource.discount > 0 
      ? resource.price * (1 - resource.discount / 100) 
      : resource.price;

    // Check if user already purchased this resource
    if (user.purchasedResources.includes(resource._id)) {
      return NextResponse.json(
        { error: 'You have already purchased this resource' },
        { status: 400 }
      );
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(finalPrice * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`, // Use timestamp for unique receipt (max 40 chars)
      notes: {
        userId: user._id.toString(),
        resourceId: resource._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userId: user._id.toString(),
      resourceId: resource._id.toString(),
      finalPrice: finalPrice,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, resourceId, finalPrice } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !userId || !resourceId || !finalPrice) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if order already exists
    const existingOrder = await Order.findOne({ razorpayOrderId });
    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order already processed' },
        { status: 400 }
      );
    }

    // Create completed order in database
    const order = await Order.create({
      userId: userId,
      resourceId: resourceId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      amount: finalPrice,
      status: 'completed',
    });

    // Add resource to user's purchased resources
    const user = await User.findById(userId);
    if (user && !user.purchasedResources.includes(resourceId)) {
      user.purchasedResources.push(resourceId);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order: order,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
