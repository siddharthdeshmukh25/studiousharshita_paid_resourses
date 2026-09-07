import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import User from '@/models/User';
import Order from '@/models/Order';
import Resource from '@/models/Resource';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const ticket = await SupportTicket.findById(id).populate('userId', 'name email image').lean();
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    // Enrich with order + resource context when an order ID is present
    let orderContext = null;
    if (ticket.orderId) {
      const order = await Order.findOne({ cashfreeOrderId: ticket.orderId })
        .populate('resourceId', 'title price')
        .lean();
      if (order) {
        orderContext = {
          orderId: order.cashfreeOrderId,
          razorpayOrderId: order.razorpayOrderId,
          amount: order.amount,
          status: order.status,
          gateway: order.gateway,
          captureStatus: order.captureStatus,
          captureFailureReason: order.captureFailureReason,
          resource: order.resourceId,
        };
      }
    }

    // Check whether the user already has access to the resource
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (ticket.userId as any)?._id?.toString() || ticket.userId?.toString();
    let hasAccess = false;
    if (orderContext?.resource) {
      const user = await User.findById(userId).select('purchasedResources').lean();
      hasAccess = !!user?.purchasedResources?.some(
        (r) => r.toString() === orderContext.resource!._id.toString()
      );
    }

    return NextResponse.json({ ticket, orderContext, hasAccess });
  } catch (error) {
    console.error('Admin get support ticket error:', error);
    return NextResponse.json({ error: 'Failed to load ticket.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json() as { text?: string; status?: string };
    const text = (body.text || '').trim();

    if (!text && !body.status) {
      return NextResponse.json({ error: 'Nothing to send.' }, { status: 400 });
    }
    if (text && text.length > 5000) {
      return NextResponse.json({ error: 'Message must be under 5000 characters.' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    if (text) {
      ticket.messages.push({ author: 'admin', text });
    }
    if (body.status && ['open', 'in_progress', 'resolved', 'closed'].includes(body.status)) {
      ticket.status = body.status as typeof ticket.status;
    }
    await ticket.save();

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Admin reply support ticket error:', error);
    return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 });
  }
}