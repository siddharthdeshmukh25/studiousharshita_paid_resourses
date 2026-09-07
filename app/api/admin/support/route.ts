import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      query.status = status;
    }
    if (source === 'contact' || source === 'support') {
      query.source = source;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { subject: { $regex: term, $options: 'i' } },
        { message: { $regex: term, $options: 'i' } },
        { orderId: { $regex: term, $options: 'i' } },
      ];
    }

    await connectDB();

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email')
      .select('subject category status source priority orderId userId createdAt updatedAt messages')
      .lean();

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Admin list support tickets error:', error);
    return NextResponse.json({ error: 'Failed to load tickets.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      ticketId?: string;
      status?: string;
      priority?: string;
    };

    if (!body.ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required.' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    if (body.status && ['open', 'in_progress', 'resolved', 'closed'].includes(body.status)) {
      update.status = body.status;
    }
    if (body.priority && ['low', 'normal', 'high'].includes(body.priority)) {
      update.priority = body.priority;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findByIdAndUpdate(
      body.ticketId,
      update,
      { new: true }
    ).populate('userId', 'name email');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Admin update support ticket error:', error);
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }
}