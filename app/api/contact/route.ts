import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import User from '@/models/User';
import { createAdminNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      category?: string;
      subject?: string;
      message?: string;
    };

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();
    const category = ['payment', 'access', 'refund', 'general', 'project'].includes(body.category || '')
      ? (body.category as 'payment' | 'access' | 'refund' | 'general' | 'project')
      : 'general';

    if (!name) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 });
    }
    if (subject.length > 200) {
      return NextResponse.json({ error: 'Subject must be under 200 characters.' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Please write your message.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be under 5000 characters.' }, { status: 400 });
    }

    await connectDB();

    // Link to an existing account when the email matches, otherwise keep the
    // ticket attachable via the reported name/email.
    const user = await User.findOne({ email });

    const ticket = await SupportTicket.create({
      userId: user?._id,
      source: 'contact',
      category,
      subject: `${subject}${user ? '' : ` — ${name}`}`,
      message,
      status: 'open',
      priority: 'normal',
      messages: [],
    });

    try {
      await createAdminNotification({
        type: 'new_contact',
        title: 'New contact message',
        message: `${name} (${email}) — ${subject}`,
        link: `/admin/support?ticket=${ticket._id.toString()}`,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to submit your message. Please try again.' }, { status: 500 });
  }
}