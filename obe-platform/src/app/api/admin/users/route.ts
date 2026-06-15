import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser, AuthError } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET    /api/admin/users — List all users (Admin only)
 * POST   /api/admin/users — Admin creates a user
 * PUT    /api/admin/users — Update user role/status (body: { userId, role?, status? })
 * DELETE /api/admin/users — Delete a user (body: { userId })
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = await getDb();
    const users = await db.collection(COLLECTIONS.USERS)
      .find({}, { projection: { passwordHash: 0 } }) // Never return password hashes
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        status: u.status || 'Active',
        createdAt: u.createdAt,
        avatar: u.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[/api/admin/users] GET Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { userId, role, status } = body;

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const db = await getDb();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const result = await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'USER_UPDATED',
      adminId: user.userId,
      targetUserId: userId,
      changes: { role, status },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[/api/admin/users] PUT Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    // Prevent self-deletion
    if (userId === user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection(COLLECTIONS.USERS).deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.collection(COLLECTIONS.AUDIT_LOG).insertOne({
      action: 'USER_DELETED',
      adminId: user.userId,
      targetUserId: userId,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[/api/admin/users] DELETE Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
