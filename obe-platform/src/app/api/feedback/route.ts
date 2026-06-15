import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/feedback — List feedback entries
 * POST /api/feedback — Submit new feedback on COs/syllabi
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const feedback = await db.collection(COLLECTIONS.FEEDBACK)
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      feedback: feedback.map((f) => ({
        id: f._id.toString(),
        type: f.type,
        targetId: f.targetId,
        targetName: f.targetName,
        comment: f.comment,
        rating: f.rating,
        createdBy: f.createdBy,
        createdByName: f.createdByName,
        createdAt: f.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/feedback] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { type, targetId, targetName, comment, rating } = body;

    if (!type || !comment) {
      return NextResponse.json(
        { error: 'Feedback type and comment are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();

    const result = await db.collection(COLLECTIONS.FEEDBACK).insertOne({
      type, // 'course', 'syllabus', 'co', 'mapping'
      targetId: targetId || null,
      targetName: targetName || '',
      comment,
      rating: rating || null,
      createdBy: user.userId,
      createdByName: user.name,
      createdByRole: user.role,
      department: user.department,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[/api/feedback] POST Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
