import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/** Verifies the admin-only session cookie. This is deliberately separate from customer NextAuth sessions. */
export async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value;
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!token || !secret) return false;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.username === 'string' && payload.username.length > 0;
  } catch {
    return false;
  }
}
