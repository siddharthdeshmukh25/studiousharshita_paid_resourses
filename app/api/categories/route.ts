import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Category from '@/models/Category';
import { hasAdminSession } from '@/lib/auth/admin';

// GET all categories
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST create new category
// Note: the admin panel writes through this endpoint, so writes are gated by
// the admin JWT cookie. GET stays public for the storefront category filter.
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await hasAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required to create categories.' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await Category.create({ name, description });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
