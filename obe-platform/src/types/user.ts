// User role enum
export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  program?: string;   // optional, for students
  semester?: number;   // optional, for students
  avatar?: string;     // optional
}

// Permission interface
export interface Permission {
  resource: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

// Resource types used across the platform
export type Resource =
  | 'course'
  | 'syllabus'
  | 'co_po_mapping'
  | 'assessment'
  | 'report'
  | 'user'
  | 'department';
