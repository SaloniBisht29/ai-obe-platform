import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/programs — List all programs
 * POST /api/programs — Create a new program (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const db = await getDb();
    const programs = await db.collection(COLLECTIONS.PROGRAMS)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      programs: programs.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        code: p.code,
        department: p.department,
        level: p.level,
        duration: p.duration,
        totalCourses: p.totalCourses || 0,
        activeCourses: p.activeCourses || 0,
        totalCOs: p.totalCOs || 0,
        completionRate: p.completionRate || 0,
        status: p.status || 'active',
        semesters: p.semesters || 8,
        createdAt: p.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[/api/programs] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { name, code, department, level, duration, semesters } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Program name and code are required' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();

    const result = await db.collection(COLLECTIONS.PROGRAMS).insertOne({
      name,
      code: code.toUpperCase(),
      department: department || 'Engineering',
      level: level || 'B.Tech',
      duration: duration || '4 Years',
      semesters: semesters || 8,
      totalCourses: 0,
      activeCourses: 0,
      totalCOs: 0,
      completionRate: 0,
      status: 'active',
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[/api/programs] POST Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
