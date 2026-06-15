import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses — List all courses for the authenticated user
 * POST /api/courses — Create a new course
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const coursesCol = db.collection(COLLECTIONS.COURSES);

    // Admins see all, Faculty see their own + department, Students see department
    const filter: Record<string, unknown> = {};
    if (user.role === 'STUDENT') {
      filter.department = user.department;
      filter.status = 'published';
    } else if (user.role === 'FACULTY') {
      filter.$or = [
        { createdBy: user.userId },
        { department: user.department },
      ];
    }
    // ADMIN sees all (no filter)

    const courses = await coursesCol
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c._id.toString(),
        code: c.code,
        name: c.name,
        semester: c.semester || 1,
        credits: c.credits || 3,
        status: c.status || 'draft',
        progress: c.progress || 0,
        department: c.department || '',
        faculty: c.faculty || 'Unassigned',
        cosCount: c.cosCount || 0,
        posCount: c.posCount || 0,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/courses] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only Faculty and Admin can create courses
    if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot create courses' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, semester, credits, department, cosCount, posCount } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Course code and name are required' }, { status: 400 });
    }

    const db = await getDb();
    const coursesCol = db.collection(COLLECTIONS.COURSES);

    // Check for duplicate course code
    const existing = await coursesCol.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: `Course code ${code} already exists` }, { status: 409 });
    }

    const now = new Date();
    const course = {
      code: code.toUpperCase(),
      name,
      semester: semester || 1,
      credits: credits || 3,
      department: department || user.department,
      faculty: user.name,
      createdBy: user.userId,
      status: 'draft',
      progress: 0,
      cosCount: cosCount || 0,
      posCount: posCount || 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await coursesCol.insertOne(course);

    // Audit log
    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'COURSE_CREATED',
      userId: user.userId,
      courseId: result.insertedId.toString(),
      courseCode: course.code,
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      course: { id: result.insertedId.toString(), ...course },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/courses] POST Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
