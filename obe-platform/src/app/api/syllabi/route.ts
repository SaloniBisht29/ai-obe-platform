import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/syllabi — List saved syllabi
 * POST /api/syllabi — Save a generated syllabus
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const filter: Record<string, unknown> = {};

    if (user.role === 'FACULTY') {
      filter.createdBy = user.userId;
    } else if (user.role === 'STUDENT') {
      filter.department = user.department;
    }

    const syllabi = await db.collection(COLLECTIONS.SYLLABI)
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      syllabi: syllabi.map((s) => ({
        id: s._id.toString(),
        courseName: s.courseName,
        courseCode: s.courseCode,
        level: s.level,
        programme: s.programme,
        createdBy: s.createdBy,
        createdByName: s.createdByName,
        createdAt: s.createdAt,
        unitCount: s.units?.length || 0,
        cosCount: s.cos?.length || 0,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/syllabi] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot save syllabi' }, { status: 403 });
    }

    const body = await req.json();
    const { courseName, courseCode, level, programme, units, cos, objectives, textbooks, references } = body;

    if (!courseName) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();

    const result = await db.collection(COLLECTIONS.SYLLABI).insertOne({
      courseName,
      courseCode: courseCode || '',
      level: level || 'undergraduate',
      programme: programme || '',
      department: user.department,
      units: units || [],
      cos: cos || [],
      objectives: objectives || [],
      textbooks: textbooks || [],
      references: references || [],
      createdBy: user.userId,
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/syllabi] POST Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
