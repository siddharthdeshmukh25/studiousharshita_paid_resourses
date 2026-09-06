import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Category from '@/models/Category';
import { hasAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}