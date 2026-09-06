import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resource from '@/models/Resource';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    await connectDB();

    // If no title provided, return all paid resources (for coupon selection)
    // If title provided, search by title (case-insensitive partial match)
    const query = title 
      ? { title: { $regex: title, $options: 'i' }, price: { $gt: 0 } }
      : { price: { $gt: 0 } };

    const resources = await Resource.find(query)
      .select('_id title category price')
      .sort({ title: 1 })
      .limit(title ? 10 : 50);

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error searching resources:', error);
    return NextResponse.json(
      { error: 'Failed to search resources' },
      { status: 500 }
    );
  }
}
