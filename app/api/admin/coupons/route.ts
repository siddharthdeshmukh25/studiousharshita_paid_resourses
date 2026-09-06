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
    const { 
      code, 
      title, 
      description,
      expiresAt, 
      discountType,
      discountPercentage, 
      discountAmount,
      minimumPurchaseAmount,
      maxUsesPerUser,
      maxTotalUses,
      applicableCategories,
      applicableResources,
      isActive,
      imageUrl,
      imageTitle,
      imageDescription
    } = await request.json() as {
      code?: string;
      title?: string;
      description?: string;
      expiresAt?: string;
      discountType?: 'percentage' | 'fixed';
      discountPercentage?: number;
      discountAmount?: number;
      minimumPurchaseAmount?: number;
      maxUsesPerUser?: number;
      maxTotalUses?: number;
      applicableCategories?: string[];
      applicableResources?: string[];
      isActive?: boolean;
      imageUrl?: string;
      imageTitle?: string;
      imageDescription?: string;
    };
    
    const normalizedCode = code?.trim().toUpperCase();
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const percentage = Number(discountPercentage);
    const amount = Number(discountAmount);
    const minAmount = minimumPurchaseAmount !== undefined ? Number(minimumPurchaseAmount) : 0;
    const maxPerUser = maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : 1;
    const maxTotal = maxTotalUses !== undefined ? Number(maxTotalUses) : undefined;

    if (!normalizedCode || !title?.trim()) {
      return NextResponse.json({ error: 'Code and title are required.' }, { status: 400 });
    }
    if (expiry && Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date.' }, { status: 400 });
    }
    if (expiry && expiry <= new Date()) return NextResponse.json({ error: 'Expiry date must be in the future.' }, { status: 400 });
    
    if (discountType === 'percentage') {
      if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
        return NextResponse.json({ error: 'Discount percentage must be between 1% and 100%.' }, { status: 400 });
      }
    } else if (discountType === 'fixed') {
      if (!Number.isFinite(amount) || amount < 1) {
        return NextResponse.json({ error: 'Discount amount must be at least ₹1.' }, { status: 400 });
      }
    }

    await connectDB();
    const couponData: any = {
      code: normalizedCode,
      title: title.trim(),
      description: description?.trim(),
      discountType: discountType || 'percentage',
      discountPercentage: discountType === 'percentage' ? percentage : undefined,
      discountAmount: discountType === 'fixed' ? amount : undefined,
      minimumPurchaseAmount: minAmount,
      maxUsesPerUser: maxPerUser,
      maxTotalUses: maxTotal,
      currentUses: 0,
      applicableCategories: applicableCategories || [],
      applicableResources: applicableResources || [],
      isActive: isActive !== undefined ? isActive : true,
      imageUrl: imageUrl?.trim() || undefined,
      imageTitle: imageTitle?.trim() || undefined,
      imageDescription: imageDescription?.trim() || undefined,
    };
    
    // Only include expiresAt if it's provided
    if (expiry) {
      couponData.expiresAt = expiry;
    }
    
    const coupon = await Coupon.create(couponData);
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

    const { 
      code, 
      title, 
      description,
      expiresAt, 
      discountType,
      discountPercentage, 
      discountAmount,
      minimumPurchaseAmount,
      maxUsesPerUser,
      maxTotalUses,
      applicableCategories,
      applicableResources,
      isActive,
      imageUrl,
      imageTitle,
      imageDescription
    } = await request.json() as {
      code?: string;
      title?: string;
      description?: string;
      expiresAt?: string;
      discountType?: 'percentage' | 'fixed';
      discountPercentage?: number;
      discountAmount?: number;
      minimumPurchaseAmount?: number;
      maxUsesPerUser?: number;
      maxTotalUses?: number;
      applicableCategories?: string[];
      applicableResources?: string[];
      isActive?: boolean;
      imageUrl?: string;
      imageTitle?: string;
      imageDescription?: string;
    };
    
    const normalizedCode = code?.trim().toUpperCase();
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const percentage = Number(discountPercentage);
    const amount = Number(discountAmount);
    const minAmount = minimumPurchaseAmount !== undefined ? Number(minimumPurchaseAmount) : 0;
    const maxPerUser = maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : 1;
    const maxTotal = maxTotalUses !== undefined ? Number(maxTotalUses) : undefined;

    if (!normalizedCode || !title?.trim()) {
      return NextResponse.json({ error: 'Code and title are required.' }, { status: 400 });
    }
    if (expiry && Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date.' }, { status: 400 });
    }
    if (expiry && expiry <= new Date()) return NextResponse.json({ error: 'Expiry date must be in the future.' }, { status: 400 });
    
    if (discountType === 'percentage') {
      if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
        return NextResponse.json({ error: 'Discount percentage must be between 1% and 100%.' }, { status: 400 });
      }
    } else if (discountType === 'fixed') {
      if (!Number.isFinite(amount) || amount < 1) {
        return NextResponse.json({ error: 'Discount amount must be at least ₹1.' }, { status: 400 });
      }
    }

    await connectDB();
    
    const couponData: any = {
      code: normalizedCode,
      title: title.trim(),
      description: description?.trim(),
      discountType: discountType || 'percentage',
      discountPercentage: discountType === 'percentage' ? percentage : undefined,
      discountAmount: discountType === 'fixed' ? amount : undefined,
      minimumPurchaseAmount: minAmount,
      maxUsesPerUser: maxPerUser,
      maxTotalUses: maxTotal,
      applicableCategories: applicableCategories || [],
      applicableResources: applicableResources || [],
      isActive: isActive !== undefined ? isActive : true,
      imageUrl: imageUrl?.trim() || undefined,
      imageTitle: imageTitle?.trim() || undefined,
      imageDescription: imageDescription?.trim() || undefined,
    };
    
    // Only include expiresAt if it's provided
    if (expiry) {
      couponData.expiresAt = expiry;
    }
    
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      couponData,
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

// PATCH to toggle coupon active status
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });

    const { isActive } = await request.json() as { isActive?: boolean };
    
    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive: isActive !== undefined ? isActive : true },
      { new: true }
    );

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    return NextResponse.json({ error: 'Failed to toggle coupon status.' }, { status: 500 });
  }
}
