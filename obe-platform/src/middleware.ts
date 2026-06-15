import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware — Route Protection
 *
 * Runs before every matched route. Checks for the auth cookie
 * and redirects unauthenticated users to /login.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public routes (no auth required) ───────────────────────────
  const publicPaths = ['/login', '/register'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith('/api/');
  const isStatic = pathname.startsWith('/_next/') || pathname.startsWith('/favicon');

  if (isPublic || isApi || isStatic) {
    return NextResponse.next();
  }

  // ── Check for auth cookie ──────────────────────────────────────
  const token = req.cookies.get('obe_auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — let the request through.
  // (Full JWT verification happens in API routes, not middleware,
  //  to keep middleware fast and avoid crypto in Edge Runtime.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/* (handled by individual route auth)
     * - /_next/* (static files)
     * - /favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
