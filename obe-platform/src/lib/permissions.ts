import { UserRole, type Resource } from '@/types/user';

// ── Permission matrix ──────────────────────────────────────────────
// Defines which roles can perform which actions on each resource.

type PermissionMatrix = Record<Resource, {
  view: UserRole[];
  edit: UserRole[];
  delete: UserRole[];
  approve: UserRole[];
}>;

const PERMISSIONS: PermissionMatrix = {
  course: {
    view: [UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.FACULTY, UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  syllabus: {
    view: [UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.FACULTY, UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  co_po_mapping: {
    view: [UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.FACULTY, UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  assessment: {
    view: [UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.FACULTY, UserRole.ADMIN],
    delete: [UserRole.FACULTY, UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  report: {
    view: [UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  user: {
    view: [UserRole.ADMIN],
    edit: [UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
  department: {
    view: [UserRole.FACULTY, UserRole.ADMIN],
    edit: [UserRole.ADMIN],
    delete: [UserRole.ADMIN],
    approve: [UserRole.ADMIN],
  },
};

// ── Permission check helpers ───────────────────────────────────────

export function canView(role: UserRole, resource: Resource): boolean {
  return PERMISSIONS[resource].view.includes(role);
}

export function canEdit(role: UserRole, resource: Resource): boolean {
  return PERMISSIONS[resource].edit.includes(role);
}

export function canDelete(role: UserRole, resource: Resource): boolean {
  return PERMISSIONS[resource].delete.includes(role);
}

export function canApprove(role: UserRole, resource: Resource): boolean {
  return PERMISSIONS[resource].approve.includes(role);
}
