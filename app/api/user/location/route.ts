import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import UserAnalytics from '@/models/UserAnalytics';
import { getClientIP, getCountryFromIP } from '@/lib/geoLocation';

/**
 * API endpoint to update user's location (country and IP address)
 * Call this after user login/signup to capture location
 */
export async function POST(request: NextRequest) {
  try {
    // Get user email from request body
    const body = await request.json();
    const { email, action = 'login' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get IP address from request
    const ipAddress = getClientIP(request);

    if (!ipAddress) {
      console.log('Could not detect IP address');
      return NextResponse.json(
        { error: 'Could not detect IP address' },
        { status: 400 }
      );
    }

    // Get country from IP
    const country = await getCountryFromIP(ipAddress);

    // Update user document with location info
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          ipAddress,
          ...(country && { country }),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Save analytics entry
    await UserAnalytics.create({
      userId: updatedUser._id,
      email: updatedUser.email,
      country: country || undefined,
      ipAddress,
      action,
    });

    console.log(`Updated location for user ${email}: IP=${ipAddress}, Country=${country || 'Not detected'}, Action=${action}`);

    return NextResponse.json({
      success: true,
      country: updatedUser.country,
      ipAddress: updatedUser.ipAddress,
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
