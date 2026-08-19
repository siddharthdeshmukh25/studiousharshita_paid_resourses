import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('Database connected successfully');
    
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);
    
    const users = await User.find({}).select('email googleDriveConnected').limit(5);
    console.log('Sample users:', users.map(u => ({ email: u.email, googleDriveConnected: u.googleDriveConnected })));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount,
      sampleUsers: users.map(u => ({ email: u.email, googleDriveConnected: u.googleDriveConnected }))
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
