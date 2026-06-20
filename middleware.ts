import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyCookie } from '@/lib/cookie-signature';

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

const protectedPaths = ['/admin', '/reception', '/members', '/payments', '/pos', '/checkin', '/products', '/coaches', '/programs', '/plans', '/notifications', '/settings', '/turnstiles', '/rfid', '/access', '/ai-coach', '/events', '/expenses', '/fidelity', '/commissions', '/private-coaching', '/consumables', '/equipment', '/finance', '/personnel', '/coach', '/dashboard'];

const receptionAllowedPaths = ['/reception', '/checkin', '/members', '/payments', '/pos', '/products', '/coaches', '/programs', '/plans', '/notifications', '/turnstiles', '/access', '/events', '/expenses', '/fidelity', '/commissions', '/private-coaching', '/consumables', '/equipment'];
const coachAllowedPaths = ['/coach', '/members', '/coaches', '/programs', '/plans', '/private-coaching', '/ai-coach'];
const adherentAllowedPaths = ['/ai-coach', '/members/profile', '/dashboard'];

function hasRoleAccess(role: string, pathname: string): boolean {
  if (role === 'admin' || role === 'staff') return true;
  if (role === 'reception') return receptionAllowedPaths.some(p => pathname.startsWith(p));
  if (role === 'coach') return coachAllowedPaths.some(p => pathname.startsWith(p));
  if (role === 'adherent') return adherentAllowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith('/api/');
  if (!isProtected && !isApiRoute) return applySecurityHeaders(NextResponse.next());

  // Public API routes that don't require auth
  const publicApiPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/setup-admin'];
  if (isApiRoute && publicApiPaths.some(p => pathname.startsWith(p))) return applySecurityHeaders(NextResponse.next());

  const authCookie = request.cookies.get('infinity-gym-auth');
  if (!authCookie?.value) {
    if (isApiRoute) {
      return applySecurityHeaders(NextResponse.json({ error: 'Not authenticated' }, { status: 401 }));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const authData = await verifyCookie(authCookie.value);
  if (!authData || !authData.role || !authData.username) {
    if (isApiRoute) {
      return applySecurityHeaders(NextResponse.json({ error: 'Invalid session' }, { status: 401 }));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (!hasRoleAccess(authData.role as string, pathname)) {
    if (isApiRoute) {
      return applySecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/admin/:path*', '/reception/:path*', '/members/:path*', '/payments/:path*', '/pos/:path*',
    '/checkin/:path*', '/products/:path*', '/coaches/:path*', '/programs/:path*',
    '/plans/:path*', '/notifications/:path*', '/settings/:path*', '/turnstiles/:path*',
    '/rfid/:path*', '/access/:path*', '/ai-coach/:path*', '/events/:path*', '/expenses/:path*',
    '/fidelity/:path*', '/commissions/:path*', '/private-coaching/:path*',
    '/consumables/:path*', '/equipment/:path*', '/finance/:path*', '/personnel/:path*',
    '/coach/:path*',
    '/dashboard/:path*',
    '/api/:path*',
  ],
};
