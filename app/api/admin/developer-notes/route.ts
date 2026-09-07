import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import DeveloperNote from '@/models/DeveloperNote';
import { hasAdminSession } from '@/lib/auth/admin';

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

export async function GET(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (status && STATUSES.includes(status)) query.status = status;
    if (priority && PRIORITIES.includes(priority)) query.priority = priority;
    if (search && search.trim()) {
      query.content = { $regex: search.trim(), $options: 'i' };
    }

    await connectDB();

    const notes = await DeveloperNote.find(query).sort({ createdAt: -1 }).limit(200).lean();

    const counts = await DeveloperNote.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = {
      total: notes.length,
      todo: 0,
      in_progress: 0,
      done: 0,
    };
    // Recompute total across the whole collection, not the filtered page
    const allCounts = await DeveloperNote.countDocuments({});
    stats.total = allCounts;
    for (const group of counts) {
      if (group._id === 'todo') stats.todo = group.count;
      if (group._id === 'in_progress') stats.in_progress = group.count;
      if (group._id === 'done') stats.done = group.count;
    }

    return NextResponse.json({ notes, stats });
  } catch (error) {
    console.error('List developer notes error:', error);
    return NextResponse.json({ error: 'Failed to load notes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      content?: string;
      status?: string;
      priority?: string;
      tags?: string[];
    };

    const content = (body.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Note content is required.' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Note must be under 2000 characters.' }, { status: 400 });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags
          .map((t) => (typeof t === 'string' ? t.trim() : ''))
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const status = (STATUSES.includes(body.status || '') ? body.status : 'todo') as 'todo' | 'in_progress' | 'done';
    const priority = (PRIORITIES.includes(body.priority || '') ? body.priority : 'medium') as 'low' | 'medium' | 'high';

    await connectDB();

    const note = await DeveloperNote.create({
      content,
      status,
      priority,
      tags,
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error('Create developer note error:', error);
    return NextResponse.json({ error: 'Failed to create note.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      id?: string;
      content?: string;
      status?: string;
      priority?: string;
      tags?: string[];
    };

    if (!body.id) {
      return NextResponse.json({ error: 'Note ID is required.' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    if (body.content !== undefined) {
      const content = String(body.content).trim();
      if (!content) return NextResponse.json({ error: 'Note content is required.' }, { status: 400 });
      if (content.length > 2000) return NextResponse.json({ error: 'Note must be under 2000 characters.' }, { status: 400 });
      update.content = content;
    }
    if (body.status && STATUSES.includes(body.status)) {
      update.status = body.status as 'todo' | 'in_progress' | 'done';
    }
    if (body.priority && PRIORITIES.includes(body.priority)) {
      update.priority = body.priority as 'low' | 'medium' | 'high';
    }
    if (Array.isArray(body.tags)) {
      update.tags = body.tags
        .map((t) => (typeof t === 'string' ? t.trim() : ''))
        .filter(Boolean)
        .slice(0, 6);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    await connectDB();

    const note = await DeveloperNote.findByIdAndUpdate(body.id, update, { new: true }).lean();
    if (!note) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Update developer note error:', error);
    return NextResponse.json({ error: 'Failed to update note.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: 'Note ID is required.' }, { status: 400 });
    }

    await connectDB();
    await DeveloperNote.findByIdAndDelete(body.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete developer note error:', error);
    return NextResponse.json({ error: 'Failed to delete note.' }, { status: 500 });
  }
}