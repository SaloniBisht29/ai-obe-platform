import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/activity
 * Returns recent activity from the audit_log collection.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const db = await getDb();

    const logs = await db.collection(COLLECTIONS.AUDIT_LOG)
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // Map audit actions to user-friendly activity items
    const actionLabels: Record<string, { type: string; description: string }> = {
      USER_REGISTER: { type: 'created', description: 'registered an account' },
      LOGIN_SUCCESS: { type: 'approved', description: 'logged in' },
      LOGIN_FAILED: { type: 'pending', description: 'failed login attempt' },
      COURSE_CREATED: { type: 'created', description: 'created a course' },
      COURSE_DELETED: { type: 'pending', description: 'deleted a course' },
      USER_UPDATED: { type: 'mapped', description: 'updated user settings' },
      USER_DELETED: { type: 'pending', description: 'removed a user' },
    };

    const activities = logs.map((log, i) => {
      const label = actionLabels[log.action] || { type: 'created', description: log.action };
      const timeAgo = getTimeAgo(log.timestamp);

      return {
        id: log._id.toString(),
        type: label.type,
        entityName: log.email || log.courseCode || 'System',
        entityCode: log.action,
        description: label.description,
        timestamp: timeAgo,
      };
    });

    return NextResponse.json({ activities });
  } catch (e) {
    console.error('[/api/dashboard/activity] Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}
