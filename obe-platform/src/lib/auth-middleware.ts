/**
 * auth-middleware.ts — JWT verification for API routes
 *
 * Provides helpers to extract and verify the current user
 * from the httpOnly auth cookie attached to API requests.
 */

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'obe-platform-dev-secret-change-in-production';
const COOKIE_NAME = 'obe_auth_token';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  iat: number;
  exp: number;
}

/**
 * Sign a JWT token for a user.
 * Token expires in 7 days.
 */
export function signToken(payload: {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token.
 * Returns the payload or null if invalid/expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract the authenticated user from a Next.js API request.
 * Reads the httpOnly cookie set during login.
 * Returns the user payload or null if not authenticated.
 */
export function getAuthUser(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require authentication — returns the user or throws.
 * Use in API routes that must be protected.
 */
export function requireAuth(req: NextRequest): JWTPayload {
  const user = getAuthUser(req);
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  return user;
}

/**
 * Require a specific role — returns the user or throws.
 */
export function requireRole(req: NextRequest, ...roles: UserRole[]): JWTPayload {
  const user = requireAuth(req);
  if (!roles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  return user;
}

/**
 * Custom error class for auth failures.
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

export { COOKIE_NAME, JWT_SECRET };
