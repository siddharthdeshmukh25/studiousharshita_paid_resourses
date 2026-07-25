import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply middleware to admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Exclude admin login page and admin API routes
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Get the admin token from cookies
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('ADMIN_JWT_SECRET is not configured');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: '/admin/:path*',
};
