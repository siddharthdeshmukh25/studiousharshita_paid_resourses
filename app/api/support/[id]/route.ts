import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createAdminNotification } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const ticket = await SupportTicket.findOne({ _id: id, userId: session.user.id })
      .populate('userId', 'name email')
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Get support ticket error:', error);
    return NextResponse.json({ error: 'Failed to load ticket.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as { text?: string };
    const text = (body.text || '').trim();

    if (!text) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Message must be under 5000 characters.' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findOne({ _id: id, userId: session.user.id });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'This ticket is closed and cannot be replied to.' }, { status: 400 });
    }

    ticket.messages.push({ author: 'user', text });
    // Reopen resolved tickets when the user follows up
    if (ticket.status === 'resolved') {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    try {
      await createAdminNotification({
        type: 'ticket_reply',
        title: 'User replied to ticket',
        message: `${session.user.name || 'A user'} replied — ${ticket.subject}`,
        link: `/admin/support?ticket=${ticket._id.toString()}`,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Reply support ticket error:', error);
    return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 });
  }
}