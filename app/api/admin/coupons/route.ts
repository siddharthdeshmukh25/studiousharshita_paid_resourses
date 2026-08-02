import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db/mongodb';
import Coupon from '@/models/Coupon';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const secretValue = process.env.ADMIN_JWT_SECRET;
  if (!token || !secretValue) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secretValue));
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { code, title, expiresAt, discountPercentage, minimumPurchaseAmount } = await request.json() as {
      code?: string;
      title?: string;
      expiresAt?: string;
      discountPercentage?: number;
      minimumPurchaseAmount?: number;
    };
    const normalizedCode = code?.trim().toUpperCase();
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const percentage = Number(discountPercentage);
    const minAmount = minimumPurchaseAmount !== undefined ? Number(minimumPurchaseAmount) : 0;

    if (!normalizedCode || !title?.trim() || !expiry || Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: 'Code, title and expiry date are required.' }, { status: 400 });
    }
    if (expiry <= new Date()) return NextResponse.json({ error: 'Expiry date must be in the future.' }, { status: 400 });
    if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
      return NextResponse.json({ error: 'Discount must be between 1% and 100%.' }, { status: 400 });
    }

    await connectDB();
    const coupon = await Coupon.create({
      code: normalizedCode,
      title: title.trim(),
      expiresAt: expiry,
      discountPercentage: percentage,
      minimumPurchaseAmount: minAmount,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });

    const { code, title, expiresAt, discountPercentage, minimumPurchaseAmount } = await request.json() as {
      code?: string;
      title?: string;
      expiresAt?: string;
      discountPercentage?: number;
      minimumPurchaseAmount?: number;
    };
    const normalizedCode = code?.trim().toUpperCase();
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const percentage = Number(discountPercentage);
    const minAmount = minimumPurchaseAmount !== undefined ? Number(minimumPurchaseAmount) : 0;

    if (!normalizedCode || !title?.trim() || !expiry || Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: 'Code, title and expiry date are required.' }, { status: 400 });
    }
    if (expiry <= new Date()) return NextResponse.json({ error: 'Expiry date must be in the future.' }, { status: 400 });
    if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
      return NextResponse.json({ error: 'Discount must be between 1% and 100%.' }, { status: 400 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code: normalizedCode,
        title: title.trim(),
        expiresAt: expiry,
        discountPercentage: percentage,
        minimumPurchaseAmount: minAmount,
      },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
