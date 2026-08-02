import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import PaymentSettings from '@/models/PaymentSettings';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  // You might want to check if user is admin here
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let settings = await PaymentSettings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await PaymentSettings.create({
        gateway: 'cashfree',
        razorpay: { keyId: '', keySecret: '' },
        payu: { key: '', salt: '' },
        cashfree: { clientId: '', clientSecret: '' },
      });
    }

    // Don't send secrets in response for security
    const safeSettings = {
      gateway: settings.gateway,
      razorpay: {
        keyId: settings.razorpay.keyId,
        hasSecret: !!settings.razorpay.keySecret,
      },
      payu: {
        key: settings.payu.key,
        hasSalt: !!settings.payu.salt,
      },
      cashfree: {
        clientId: settings.cashfree.clientId,
        hasSecret: !!settings.cashfree.clientSecret,
      },
    };

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await connectDB();

    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      // Create new settings
      settings = await PaymentSettings.create({
        gateway: body.gateway || 'cashfree',
        razorpay: {
          keyId: body.razorpay?.keyId || '',
          keySecret: body.razorpay?.keySecret || '',
        },
        payu: {
          key: body.payu?.key || '',
          salt: body.payu?.salt || '',
        },
        cashfree: {
          clientId: body.cashfree?.clientId || '',
          clientSecret: body.cashfree?.clientSecret || '',
        },
      });
    } else {
      // Update existing settings
      const previousGateway = settings.gateway;
      settings.gateway = body.gateway || settings.gateway;

      // Security: Clear credentials of previous gateway when switching
      if (previousGateway !== settings.gateway) {
        if (previousGateway === 'razorpay') {
          settings.razorpay.keyId = '';
          settings.razorpay.keySecret = '';
        } else if (previousGateway === 'payu') {
          settings.payu.key = '';
          settings.payu.salt = '';
        } else if (previousGateway === 'cashfree') {
          settings.cashfree.clientId = '';
          settings.cashfree.clientSecret = '';
        }
      }

      if (body.razorpay) {
        settings.razorpay.keyId = body.razorpay.keyId || settings.razorpay.keyId;
        settings.razorpay.keySecret = body.razorpay.keySecret || settings.razorpay.keySecret;
      }

      if (body.payu) {
        settings.payu.key = body.payu.key || settings.payu.key;
        settings.payu.salt = body.payu.salt || settings.payu.salt;
      }

      if (body.cashfree) {
        settings.cashfree.clientId = body.cashfree.clientId || settings.cashfree.clientId;
        settings.cashfree.clientSecret = body.cashfree.clientSecret || settings.cashfree.clientSecret;
      }

      await settings.save();
    }

    return NextResponse.json({ success: true, gateway: settings.gateway });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json({ error: 'Failed to update payment settings' }, { status: 500 });
  }
}
