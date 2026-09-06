import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import UserActivity from '@/models/UserActivity';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ tracked: false });

  try {
    const { path, isSessionStart } = await request.json() as { path?: string; isSessionStart?: boolean };
    if (!path || !path.startsWith('/') || path.length > 300) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    
    await connectDB();
    
    // Only track if it's a session start (first visit)
    if (isSessionStart) {
      await UserActivity.create({ 
        userId: new mongoose.Types.ObjectId(session.user.id), 
        action: 'page_view', 
        path 
      });
    }
    
    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false });
  }
}
