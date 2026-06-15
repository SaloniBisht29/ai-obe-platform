import { UserRole, type User } from '@/types/user';

// ── Local-storage key (used as client-side cache for user data) ────
const AUTH_KEY = 'obe_current_user';

// ── Types ──────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  program?: string;
  semester?: number;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  error?: string;
}

// ── Auth API calls ─────────────────────────────────────────────────

/**
 * Register a new user via the /api/auth/register endpoint.
 * Returns the user object on success, or throws an error.
 */
export async function register(data: RegisterData): Promise<User> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || 'Registration failed');
  }

  const user = json.user as User;
  // Cache user data in localStorage for client-side access
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
  return user;
}

/**
 * Log in with email and password via /api/auth/login.
 * The JWT is set as an httpOnly cookie by the server.
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || 'Login failed');
  }

  const user = json.user as User;
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
  return user;
}

/**
 * Get the current user from the server session.
 * Falls back to localStorage cache if server is unavailable.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', { method: 'GET' });
    if (!res.ok) {
      // Not authenticated — clear local cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_KEY);
      }
      return null;
    }
    const json = await res.json();
    const user = json.user as User;
    // Update cache
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    // Network error — use cached data
    return getCurrentUser();
  }
}

/**
 * Read the current user from localStorage cache.
 * This is a synchronous, client-side-only helper.
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** Persist a user object to localStorage (for backward compat). */
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/**
 * Log out — clears the httpOnly cookie on the server
 * and removes the localStorage cache.
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort logout
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

// ── Backward-compat: Mock users for fallback/demo ──────────────────
export const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.STUDENT]: {
    id: 'stu-001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@university.edu',
    role: UserRole.STUDENT,
    department: 'Computer Science & Engineering',
    program: 'B.Tech CSE',
    semester: 5,
    avatar: '/avatars/student.png',
  },
  [UserRole.FACULTY]: {
    id: 'fac-001',
    name: 'Dr. Priya Singh',
    email: 'priya.singh@university.edu',
    role: UserRole.FACULTY,
    department: 'Computer Science & Engineering',
    avatar: '/avatars/faculty.png',
  },
  [UserRole.ADMIN]: {
    id: 'adm-001',
    name: 'Prof. Rajesh Kumar',
    email: 'rajesh.kumar@university.edu',
    role: UserRole.ADMIN,
    department: 'Computer Science & Engineering',
    avatar: '/avatars/admin.png',
  },
};
