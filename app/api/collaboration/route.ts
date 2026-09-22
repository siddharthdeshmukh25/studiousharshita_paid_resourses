import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SupportTicket from '@/models/SupportTicket';
import User from '@/models/User';
import { createAdminNotification } from '@/lib/notifications';

const PARTNERSHIP_TYPES = ['sponsored-post', 'brand-integration', 'product-review', 'affiliate', 'other'] as const;
type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

const BUDGET_RANGES = ['undecided', 'under-25k', '25k-75k', '75k-2l', '2l-plus'] as const;
type BudgetRange = (typeof BUDGET_RANGES)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      brand?: string;
      partnershipType?: string;
      budget?: string;
      message?: string;
    };

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const brand = (body.brand || '').trim();
    const message = (body.message || '').trim();
    const partnershipType: PartnershipType = PARTNERSHIP_TYPES.includes(body.partnershipType as PartnershipType)
      ? (body.partnershipType as PartnershipType)
      : 'sponsored-post';
    const budget: BudgetRange = BUDGET_RANGES.includes(body.budget as BudgetRange)
      ? (body.budget as BudgetRange)
      : 'undecided';

    if (!name) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!brand) {
      return NextResponse.json({ error: 'Please tell me your brand or company name.' }, { status: 400 });
    }
    if (brand.length > 120) {
      return NextResponse.json({ error: 'Brand name must be under 120 characters.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Please describe your idea in at least 10 characters.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be under 5000 characters.' }, { status: 400 });
    }

    await connectDB();

    // Link to an existing account when the email matches, otherwise the
    // reporter name/email in the ticket keeps it reachable.
    const user = await User.findOne({ email });

    const subject = `${brand} — ${partnershipType} enquiry${user ? '' : ` — ${name}`}`;
    const fullMessage = [
      `Brand: ${brand}`,
      `Partnership type: ${partnershipType}`,
      `Budget: ${budget}`,
      '',
      message,
    ].join('\n');

    const ticket = await SupportTicket.create({
      userId: user?._id,
      source: 'collaboration',
      category: 'collaboration',
      subject,
      message: fullMessage,
      status: 'open',
      priority: 'high',
      messages: [],
    });

    try {
      await createAdminNotification({
        type: 'new_collab',
        title: 'New collaboration enquiry',
        message: `${name} (${email}) — ${brand} · ${partnershipType} · ${budget}`,
        link: `/admin/support?ticket=${ticket._id.toString()}`,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Collaboration enquiry error:', error);
    return NextResponse.json({ error: 'Failed to submit your enquiry. Please try again.' }, { status: 500 });
  }
}