import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { signToken, COOKIE_NAME } from '@/lib/auth-middleware';
import { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, department, program?, semester? }
 */
export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    department?: string;
    program?: string;
    semester?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Validate required fields ─────────────────────────────────────
  const { name, email, password, role, department } = body;

  if (!name || !email || !password || !role || !department) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email, password, role, department' },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Validate password strength
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Validate role
  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(role as UserRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const usersCol = db.collection(COLLECTIONS.USERS);

    // ── Check if email already exists ────────────────────────────────
    const existing = await usersCol.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // ── Hash password ────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // ── Create user ──────────────────────────────────────────────────
    const now = new Date();
    const result = await usersCol.insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role as UserRole,
      department,
      program: body.program || null,
      semester: body.semester || null,
      avatar: null,
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();

    // ── Sign JWT ─────────────────────────────────────────────────────
    const token = signToken({
      userId,
      email: email.toLowerCase(),
      name,
      role: role as UserRole,
      department,
    });

    // ── Set httpOnly cookie ──────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        role,
        department,
        program: body.program || null,
        semester: body.semester || null,
      },
    }, { status: 201 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // ── Audit log ────────────────────────────────────────────────────
    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'USER_REGISTER',
      userId,
      email: email.toLowerCase(),
      role,
      timestamp: now,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    });

    return response;
  } catch (e) {
    console.error('[/api/auth/register] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
