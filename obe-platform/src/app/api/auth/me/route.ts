import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT cookie.
 */
export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
}
