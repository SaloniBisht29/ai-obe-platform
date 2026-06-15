import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { signToken, COOKIE_NAME } from '@/lib/auth-middleware';
import { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

// ── Simple rate limiter (in-memory, per-IP) ────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // ── Rate limit check ───────────────────────────────────────────────
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait 1 minute.' },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const usersCol = db.collection(COLLECTIONS.USERS);

    // ── Find user ────────────────────────────────────────────────────
    const user = await usersCol.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ── Verify password ──────────────────────────────────────────────
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // ── Audit failed login ─────────────────────────────────────────
      await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
        action: 'LOGIN_FAILED',
        email: email.toLowerCase(),
        timestamp: new Date(),
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = user._id.toString();

    // ── Sign JWT ─────────────────────────────────────────────────────
    const token = signToken({
      userId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      department: user.department,
    });

    // ── Response ─────────────────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        program: user.program || null,
        semester: user.semester || null,
        avatar: user.avatar || null,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // ── Audit successful login ───────────────────────────────────────
    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'LOGIN_SUCCESS',
      userId,
      email: user.email,
      role: user.role,
      timestamp: new Date(),
      ip,
    });

    // Reset rate limit on success
    loginAttempts.delete(ip);

    return response;
  } catch (e) {
    console.error('[/api/auth/login] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
