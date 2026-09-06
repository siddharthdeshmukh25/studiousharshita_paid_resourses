import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import mongoose from 'mongoose';

// Simple in-memory rate limiting (Tier 2: Speed Breaker)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// MongoDB Schema for Account Shield (Tier 3)
const LoginAttemptSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastAttempt: { type: Date, default: Date.now }
});

// Prevent model recompilation
const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', LoginAttemptSchema);

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Tier 2: Speed Breaker - Rate Limiting
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// Tier 3: Account Shield - Check if account is locked
async function checkAccountLock(username: string): Promise<boolean> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const record = await LoginAttempt.findOne({ username });
    
    if (!record) return false;
    
    // Check if lock has expired
    if (record.lockedUntil && new Date() < record.lockedUntil) {
      return true;
    }
    
    // Reset if lock expired
    if (record.lockedUntil && new Date() >= record.lockedUntil) {
      await LoginAttempt.updateOne(
        { username },
        { failedAttempts: 0, lockedUntil: null }
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error checking account lock:', error);
    return false;
  }
}

// Tier 3: Account Shield - Track failed attempts
async function trackFailedAttempt(username: string): Promise<{ locked: boolean; remaining: number }> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
    
    let record = await LoginAttempt.findOne({ username });
    
    if (!record) {
      record = await LoginAttempt.create({
        username,
        failedAttempts: 1,
        lastAttempt: new Date()
      });
      return { locked: false, remaining: MAX_ATTEMPTS - 1 };
    }
    
    // Reset if previous lock expired
    if (record.lockedUntil && new Date() >= record.lockedUntil) {
      record.failedAttempts = 0;
      record.lockedUntil = null;
    }
    
    record.failedAttempts += 1;
    record.lastAttempt = new Date();
    
    // Lock account if max attempts reached
    if (record.failedAttempts >= MAX_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + LOCK_DURATION);
      await record.save();
      return { locked: true, remaining: 0 };
    }
    
    await record.save();
    return { locked: false, remaining: MAX_ATTEMPTS - record.failedAttempts };
    
  } catch (error) {
    console.error('Error tracking failed attempt:', error);
    return { locked: false, remaining: 0 };
  }
}

// Tier 3: Account Shield - Clear failed attempts on success
async function clearFailedAttempts(username: string): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    await LoginAttempt.updateOne(
      { username },
      { failedAttempts: 0, lockedUntil: null }
    );
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.ADMIN_JWT_SECRET;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const clientIP = getClientIP(request);

    // Tier 2: Speed Breaker - Rate Limiting
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: 60 // 1 minute
        },
        { status: 429 }
      );
    }

    // Tier 3: Account Shield - Check if account is locked
    const isLocked = await checkAccountLock(username);
    if (isLocked) {
      return NextResponse.json(
        { 
          error: 'This account has been temporarily locked due to multiple failed login attempts. Please try again later.',
          lockDuration: 15 // 15 minutes
        },
        { status: 403 }
      );
    }

    // Verify credentials
    if (username !== adminUsername || password !== adminPassword) {
      // Tier 3: Account Shield - Track failed attempts
      const attemptResult = await trackFailedAttempt(username);
      
      if (attemptResult.locked) {
        return NextResponse.json(
          { 
            error: 'Too many failed login attempts. This account has been temporarily locked.',
            attemptsRemaining: 0
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          attemptsRemaining: attemptResult.remaining,
          rateLimitRemaining: rateLimitCheck.remaining
        },
        { status: 401 }
      );
    }

    // SUCCESS: Clear failed attempts
    await clearFailedAttempts(username);

    // Generate JWT token
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ 
      success: true,
      rateLimitRemaining: rateLimitCheck.remaining 
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
