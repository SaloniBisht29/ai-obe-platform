import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET    /api/courses/[id] — Get course details
 * PUT    /api/courses/[id] — Update course
 * DELETE /api/courses/[id] — Delete course
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    const course = await db.collection(COLLECTIONS.COURSES).findOne({
      _id: new ObjectId(id),
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      course: { id: course._id.toString(), ...course, _id: undefined },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/courses/[id]] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const db = await getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = ['name', 'semester', 'credits', 'department', 'status', 'progress', 'cosCount', 'posCount'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Only Admin can change status to 'approved' or 'published'
    if (body.status && ['approved', 'published'].includes(body.status) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can approve or publish courses' }, { status: 403 });
    }

    const result = await db.collection(COLLECTIONS.COURSES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course updated' });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/courses/[id]] PUT Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete courses' }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDb();

    const result = await db.collection(COLLECTIONS.COURSES).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Audit log
    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'COURSE_DELETED',
      userId: user.userId,
      courseId: id,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Course deleted' });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/courses/[id]] DELETE Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
