import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get only paid resources for coupon selection
    const resources = await Resource.find({
      price: { $gt: 0 }
    })
    .select('_id title category price')
    .sort({ title: 1 })
    .limit(50);

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}