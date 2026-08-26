import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ResourceAnalytics from '@/models/ResourceAnalytics';
import Resource from '@/models/Resource';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to check if user is admin/manager
async function isAdmin(session: any) {
  if (!session?.user?.email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(session.user.email);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check if resource is paid
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const isPaidResource = resource.price > 0;

    // Get customer data for paid resources only
    if (!isPaidResource) {
      return NextResponse.json({ 
        error: 'Customer analytics only available for paid resources',
        isPaidResource: false
      }, { status: 400 });
    }

    // Get all orders for this resource
    const orders = await Order.find({ 
      resourceId: new mongoose.Types.ObjectId(resourceId),
      status: 'completed'
    }).populate('userId', 'name email');

    // Get detailed customer information
    const customers = await Promise.all(orders.map(async (order) => {
      const user = await User.findById(order.userId);
      if (!user) return null;

      // Get customer's interaction analytics
      const customerAnalytics = await ResourceAnalytics.find({
        resourceId: new mongoose.Types.ObjectId(resourceId),
        visitorId: user._id
      }).sort({ timestamp: -1 });

      const firstInteraction = customerAnalytics[customerAnalytics.length - 1];
      const lastInteraction = customerAnalytics[0];

      return {
        customerId: user._id.toString(),
        customerName: user.name,
        customerEmail: user.email, // This will be masked in the frontend
        purchaseDate: order.createdAt,
        purchaseAmount: order.amount,
        paymentGateway: order.gateway,
        orderId: order.cashfreeOrderId,
        firstInteractionDate: firstInteraction?.timestamp,
        lastInteractionDate: lastInteraction?.timestamp,
        totalInteractions: customerAnalytics.length,
        deviceTypes: [...new Set(customerAnalytics.map(a => a.deviceType))],
        trafficSources: [...new Set(customerAnalytics.map(a => a.trafficSource))],
        timeOnPage: customerAnalytics
          .filter(a => a.eventType === 'time_on_page' && a.timeOnPage)
          .reduce((sum, a) => sum + (a.timeOnPage || 0), 0),
        location: customerAnalytics.find(a => a.location)?.location
      };
    }));

    // Filter out null values and sort by purchase date
    const validCustomers = customers
      .filter(customer => customer !== null)
      .sort((a, b) => new Date(b!.purchaseDate).getTime() - new Date(a!.purchaseDate).getTime());

    // Calculate aggregate customer metrics
    const customerMetrics = {
      totalCustomers: validCustomers.length,
      totalRevenue: validCustomers.reduce((sum, c) => sum + (c?.purchaseAmount || 0), 0),
      avgPurchaseValue: validCustomers.length > 0 
        ? (validCustomers.reduce((sum, c) => sum + (c?.purchaseAmount || 0), 0) / validCustomers.length).toFixed(2)
        : '0.00',
      repeatCustomers: validCustomers.filter(c => c?.totalInteractions > 1).length,
      avgInteractionsPerCustomer: validCustomers.length > 0
        ? (validCustomers.reduce((sum, c) => sum + (c?.totalInteractions || 0), 0) / validCustomers.length).toFixed(1)
        : '0.0',
      deviceBreakdown: {} as Record<string, number>,
      sourceBreakdown: {} as Record<string, number>
    };

    // Calculate device breakdown
    validCustomers.forEach(customer => {
      customer?.deviceTypes.forEach(device => {
        customerMetrics.deviceBreakdown[device] = (customerMetrics.deviceBreakdown[device] || 0) + 1;
      });
    });

    // Calculate source breakdown
    validCustomers.forEach(customer => {
      customer?.trafficSources.forEach(source => {
        customerMetrics.sourceBreakdown[source] = (customerMetrics.sourceBreakdown[source] || 0) + 1;
      });
    });

    return NextResponse.json({
      resourceTitle: resource.title,
      isPaidResource: true,
      customers: validCustomers,
      metrics: customerMetrics
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer analytics' }, { status: 500 });
  }
}
