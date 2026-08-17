import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Order from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId: string; resourceId: string; orderId?: string };
    const { userId, resourceId, orderId } = body;

    if (!userId || !resourceId) {
      return NextResponse.json({ error: 'User ID and Resource ID are required.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    const resource = await Resource.findById(resourceId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    // Check if user already has access
    if (user.purchasedResources.includes(resource._id)) {
      return NextResponse.json({ error: 'User already has access to this resource.' }, { status: 400 });
    }

    // Grant access
    user.purchasedResources.push(resource._id);
    await user.save();

    // Create order record if orderId provided
    if (orderId) {
      const existingOrder = await Order.findOne({ cashfreeOrderId: orderId });
      if (!existingOrder) {
        await Order.create({
          userId,
          resourceId,
          cashfreeOrderId: orderId,
          amount: resource.price,
          status: 'completed',
          gateway: 'manual',
          captureStatus: 'success',
          paymentCaptured: true,
        });
      } else {
        await Order.updateOne(
          { cashfreeOrderId: orderId },
          { status: 'completed', captureStatus: 'success', paymentCaptured: true }
        );
      }
    } else {
      // Create order without payment ID for manual grants
      await Order.create({
        userId,
        resourceId,
        amount: resource.price,
        status: 'completed',
        gateway: 'manual',
        captureStatus: 'success',
        paymentCaptured: true,
      });
    }

    return NextResponse.json({ success: true, message: 'Access granted successfully.' });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Failed to grant access.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { userId: string; resourceId: string };
    const { userId, resourceId } = body;

    if (!userId || !resourceId) {
      return NextResponse.json({ error: 'User ID and Resource ID are required.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    const resource = await Resource.findById(resourceId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    // Check if user has access
    if (!user.purchasedResources.includes(resource._id)) {
      return NextResponse.json({ error: 'User does not have access to this resource.' }, { status: 400 });
    }

    // Revoke access
    user.purchasedResources = user.purchasedResources.filter(id => !id.equals(resource._id));
    await user.save();

    return NextResponse.json({ success: true, message: 'Access revoked successfully.' });
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: 'Failed to revoke access.' }, { status: 500 });
  }
}
