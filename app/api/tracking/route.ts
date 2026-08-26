import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import ResourceAnalytics from '@/models/ResourceAnalytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to detect device type
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' | 'other' {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|kindle|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/desktop|windows|macintosh|linux|x11/i.test(ua)) {
    return 'desktop';
  }
  return 'other';
}

// Helper function to detect browser
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/chrome|crios/i.test(ua) && !/edge|opr/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/edge/i.test(ua)) return 'Edge';
  if (/opr/i.test(ua)) return 'Opera';
  return 'Unknown';
}

// Helper function to detect OS
function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac|macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

// Helper function to detect social platform from referrer
function detectSocialPlatform(referrer: string): 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'other' | undefined {
  if (!referrer) return undefined;
  const ref = referrer.toLowerCase();
  if (ref.includes('instagram.com')) return 'instagram';
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'youtube';
  if (ref.includes('twitter.com') || ref.includes('x.com')) return 'twitter';
  if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'facebook';
  if (ref.includes('linkedin.com')) return 'linkedin';
  if (ref.includes('whatsapp.com')) return 'whatsapp';
  if (ref.includes('t.me') || ref.includes('telegram')) return 'other';
  return undefined;
}

// Helper function to determine traffic source
function determineTrafficSource(referrer: string, urlParams: URLSearchParams): 'direct' | 'shared_link' | 'internal_navigation' | 'social_media' | 'email' | 'search_engine' | 'other' {
  // Check if it's from a shared link (has ref parameter)
  if (urlParams.has('ref') && urlParams.get('ref') !== 'direct') {
    return 'shared_link';
  }
  
  if (!referrer) return 'direct';
  
  const ref = referrer.toLowerCase();
  const currentDomain = urlParams.get('domain') || '';
  
  // Internal navigation
  if (currentDomain && ref.includes(currentDomain)) {
    return 'internal_navigation';
  }
  
  // Social media
  if (detectSocialPlatform(referrer)) {
    return 'social_media';
  }
  
  // Email
  if (ref.includes('mailto:') || ref.includes('mail.google') || ref.includes('outlook')) {
    return 'email';
  }
  
  // Search engines
  if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.') || ref.includes('duckduckgo')) {
    return 'search_engine';
  }
  
  return 'other';
}

// Helper function to get location from IP (basic implementation)
async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string; region?: string } | undefined> {
  try {
    // Using a free IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || undefined,
        city: data.city || undefined,
        region: data.region || undefined
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, eventType, referrer, timeOnPage, metadata } = body;
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }
    
    if (!eventType || !['page_view', 'click', 'purchase', 'share', 'time_on_page'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }
    
    await connectDB();
    
    // Get session for logged-in visitors
    const session = await getServerSession(authOptions);
    const visitorId = session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined;
    
    // Get or generate session ID for anonymous tracking
    let sessionId = body.sessionId;
    if (!sessionId) {
      sessionId = randomUUID();
    }
    
    // Get request headers for device detection
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = detectDeviceType(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);
    
    // Get IP address for location
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Get location (async, don't block)
    let location;
    if (ip !== 'unknown') {
      try {
        location = await getLocationFromIP(ip);
      } catch (error) {
        console.error('Location detection failed:', error);
      }
    }
    
    // Determine traffic source
    const urlParams = new URL(request.url).searchParams;
    const trafficSource = determineTrafficSource(referrer || '', urlParams);
    
    // Detect social platform if applicable
    const socialPlatform = trafficSource === 'social_media' ? detectSocialPlatform(referrer || '') : undefined;
    
    // Create analytics record
    const analyticsRecord = await ResourceAnalytics.create({
      resourceId: new mongoose.Types.ObjectId(resourceId),
      visitorId,
      sessionId,
      eventType,
      trafficSource,
      referrer: referrer?.slice(0, 500),
      deviceType,
      browser,
      os,
      location,
      socialPlatform,
      timeOnPage,
      conversionEvent: eventType === 'purchase',
      metadata,
      timestamp: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      sessionId,
      recordId: analyticsRecord._id 
    });
    
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}

// Generate tracking link for a resource
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }
    
    // Generate a tracking link with session ID
    const sessionId = randomUUID();
    const baseUrl = request.nextUrl.origin;
    const trackingLink = `${baseUrl}/resource/${resourceId}?ref=shared&sid=${sessionId}`;
    
    return NextResponse.json({ 
      trackingLink,
      sessionId 
    });
    
  } catch (error) {
    console.error('Link generation error:', error);
    return NextResponse.json({ error: 'Failed to generate tracking link' }, { status: 500 });
  }
}
