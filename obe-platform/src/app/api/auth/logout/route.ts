import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * Clears the authentication cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
