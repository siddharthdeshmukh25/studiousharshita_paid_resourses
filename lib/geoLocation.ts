/**
 * Geolocation utilities for IP address and country detection
 */

// Simple in-memory cache for IP to country mapping
const ipCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request): string | null {
  // Check various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const xRealIP = request.headers.get('x-real-ip');
  
  // x-forwarded-for can contain multiple IPs, take the first one
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  return null;
}

/**
 * Get country code from IP address using free API with fallback
 * Returns country code (e.g., 'IN', 'US', 'UK') or null if failed
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip local/private IPs
  if (isLocalIP(ip)) {
    console.log(`Skipping local IP: ${ip}`);
    return null;
  }

  // Check cache first
  const cached = ipCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached country for IP ${ip}: ${cached.country}`);
    return cached.country;
  }

  try {
    // Try ip-api.com first (better free tier, no rate limit for non-commercial use)
    let countryCode = await tryIpApi(ip);
    
    // Fallback to ipapi.co if ip-api fails
    if (!countryCode) {
      countryCode = await tryIpapiCo(ip);
    }

    // Cache the result if successful
    if (countryCode) {
      ipCache.set(ip, { country: countryCode, timestamp: Date.now() });
      console.log(`Cached country for IP ${ip}: ${countryCode}`);
    }

    return countryCode;
  } catch (error) {
    console.error('Error detecting country:', error);
    return null;
  }
}

/**
 * Check if IP is local/private
 */
function isLocalIP(ip: string): boolean {
  // IPv4 local ranges
  const ipv4Local = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(ip);
  // IPv6 local
  const ipv6Local = /^(::1|fe80:|fc00:)/.test(ip);
  // localhost
  const localhost = ip === 'localhost' || ip === '::1';
  
  return ipv4Local || ipv6Local || localhost;
}

/**
 * Try ip-api.com (free, no rate limit for non-commercial use)
 */
async function tryIpApi(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error('ip-api.com failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.countryCode) {
      return data.countryCode;
    }
    
    return null;
  } catch (error) {
    console.error('ip-api.com error:', error);
    return null;
  }
}

/**
 * Try ipapi.co (backup API)
 */
async function tryIpapiCo(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error('ipapi.co failed:', response.status);
      return null;
    }

    const countryCode = await response.text();
    
    // Validate country code (2 letters)
    if (countryCode && countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
      return countryCode;
    }
    
    return null;
  } catch (error) {
    console.error('ipapi.co error:', error);
    return null;
  }
}

/**
 * Get detailed location info from IP address (optional)
 * Returns country name, city, etc. or null if failed
 */
export async function getLocationFromIP(ip: string): Promise<{
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
} | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || '',
        countryCode: data.countryCode || '',
        city: data.city,
        region: data.regionName,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting location:', error);
    return null;
  }
}
