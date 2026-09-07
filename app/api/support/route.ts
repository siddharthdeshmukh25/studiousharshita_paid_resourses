import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createAdminNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    const body = await request.json() as {
      orderId?: string;
      category?: string;
      subject?: string;
      message?: string;
      source?: string;
    };

    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();
    const category = ['payment', 'access', 'refund', 'general', 'project'].includes(body.category || '')
      ? (body.category as 'payment' | 'access' | 'refund' | 'general' | 'project')
      : 'general';

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }
    if (subject.length > 200) {
      return NextResponse.json({ error: 'Subject must be under 200 characters.' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Please describe your issue.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be under 5000 characters.' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.create({
      userId: session.user.id,
      orderId: body.orderId?.trim() || undefined,
      source: body.source === 'contact' ? 'contact' : 'support',
      category,
      subject,
      message,
      status: 'open',
      priority: 'normal',
      messages: [],
    });

    // Notify admins about the new ticket
    try {
      await createAdminNotification({
        type: 'new_ticket',
        title: body.source === 'contact' ? 'New contact message' : 'New support ticket',
        message: `${session.user.name || 'A user'} — ${subject}`,
        link: `/admin/support?ticket=${ticket._id.toString()}`,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source');

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: session.user.id };
    if (source === 'contact' || source === 'support') query.source = source;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('subject category status source orderId createdAt updatedAt messages')
      .lean();

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('List support tickets error:', error);
    return NextResponse.json({ error: 'Failed to load tickets.' }, { status: 500 });
  }
}