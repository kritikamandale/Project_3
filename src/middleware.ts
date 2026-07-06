import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Secrets (Edge-compatible) ────────────────────────────────────────────────
const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

// ─── Route maps ───────────────────────────────────────────────────────────────
const ROLE_PREFIXES: Record<string, string> = {
  '/host':   'host',
  '/vendor': 'vendor',
  '/admin':  'super_admin',
};

// API routes that require authentication
const PROTECTED_API_PREFIXES = [
  '/api/events',
  '/api/vendors',
  '/api/payments',
  '/api/ai',
  '/api/notifications',
  '/api/upload',
  '/api/invite',
];

// API routes that are always public
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
];

// Public page routes (exact match or prefix)
const PUBLIC_PAGES = new Set(['/', '/about', '/pricing']);
const PUBLIC_PREFIXES = ['/vendors', '/invite/', '/checkin/'];

// Auth pages (redirect authenticated users away)
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Sensitive routes to audit (logged via x-audit-route header, picked up by API handler)
const SENSITIVE_PREFIXES = ['/admin', '/api/payments', '/api/ai'];

interface JWTUser {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

async function extractUser(token: string): Promise<JWTUser | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload as unknown as JWTUser;
  } catch {
    return null;
  }
}

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname.startsWith(p));
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function getRequiredRoleForPath(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix)) return role;
  }
  return null;
}

function isSensitiveRoute(pathname: string): boolean {
  return SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p));
}

function hasRoleAccess(userRole: string, requiredRole: string): boolean {
  if (userRole === 'super_admin') return true; // super_admin can access everything
  return userRole === requiredRole;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // ── 0. Public pages — skip all auth logic entirely ─────────────────────────
  if (isPublicPage(pathname) || isAuthPage(pathname)) {
    // Still try to attach user context if a valid token exists, but never block
    const quickToken = request.cookies.get('milap_session')?.value ?? null;
    if (quickToken) {
      const quickUser = await extractUser(quickToken);
      if (quickUser && isAuthPage(pathname)) {
        const dashboardMap: Record<string, string> = {
          super_admin: '/admin/dashboard',
          host:        '/host/dashboard',
          vendor:      '/vendor/dashboard',
          guest:       '/',
        };
        return NextResponse.redirect(
          new URL(dashboardMap[quickUser.role] ?? '/', request.url)
        );
      }
      if (quickUser) {
        const response = NextResponse.next();
        response.headers.set('x-user-id',    quickUser.sub);
        response.headers.set('x-user-role',  quickUser.role);
        response.headers.set('x-user-email', quickUser.email);
        return response;
      }
    }
    return NextResponse.next();
  }

  const accessToken    = request.cookies.get('milap_session')?.value ?? null;
  const rawRefreshToken = request.cookies.get('milap_refresh')?.value ?? null;

  // ── 1. Try to verify access token ──────────────────────────────────────────
  let user: JWTUser | null = null;

  if (accessToken) {
    user = await extractUser(accessToken);
  }

  // ── 2. Silent refresh — access token expired but refresh token exists ───────
  if (!user && rawRefreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    let refreshRes: Response | null = null;
    try {
      refreshRes = await fetch(refreshUrl.toString(), {
        method:  'POST',
        headers: { cookie: request.headers.get('cookie') ?? '' },
      });
    } catch (e) {
      console.error('Middleware self-fetch failed:', e);
    }

    if (refreshRes && refreshRes.ok) {
      // Build the response and copy the Set-Cookie headers from the refresh call
      const response = NextResponse.next();
      const setCookies = refreshRes.headers.getSetCookie?.() ?? [];
      for (const cookie of setCookies) {
        response.headers.append('Set-Cookie', cookie);
      }

      // Re-read the new access token from Set-Cookie to attach user headers
      const newAccessCookie = setCookies
        .find((c) => c.startsWith('milap_session='))
        ?.split(';')[0]
        ?.replace('milap_session=', '');

      if (newAccessCookie) {
        user = await extractUser(newAccessCookie);
      }

      if (user) {
        response.headers.set('x-user-id',    user.sub);
        response.headers.set('x-user-role',  user.role);
        response.headers.set('x-user-email', user.email);
      }

      if (isSensitiveRoute(pathname)) {
        response.headers.set('x-audit-route', pathname);
      }

      return response;
    }

    // Refresh also failed — clear stale cookies
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete('milap_session');
    redirectRes.cookies.delete('milap_refresh');
    return redirectRes;
  }

  // ── 3. Public API routes — always allow ─────────────────────────────────────
  if (pathname.startsWith('/api/') && isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // ── 4. Protected API routes — require valid session ─────────────────────────
  if (pathname.startsWith('/api/') && isProtectedApi(pathname)) {
    const isPublicVendorGet = request.method === 'GET' && 
      (pathname === '/api/vendors' || /^\/api\/vendors\/[^\/]+(\/reviews)?$/.test(pathname));

    if (!user && !isPublicVendorGet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── 7. Dashboard routes — require auth + correct role ───────────────────────
  const requiredRole = getRequiredRoleForPath(pathname);

  if (requiredRole !== null) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasRoleAccess(user.role, requiredRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // ── 8. Any other unauthenticated request to a non-public path ───────────────
  if (!user && !isPublicPage(pathname) && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 9. Attach user context to request headers ────────────────────────────────
  const response = NextResponse.next();

  if (user) {
    response.headers.set('x-user-id',    user.sub);
    response.headers.set('x-user-role',  user.role);
    response.headers.set('x-user-email', user.email);
  }

  if (isSensitiveRoute(pathname)) {
    response.headers.set('x-audit-route', pathname);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|sw.js|manifest.json).*)',
  ],
};
