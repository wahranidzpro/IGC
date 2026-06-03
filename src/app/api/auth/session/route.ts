import { NextRequest, NextResponse } from 'next/server';
import { signCookie, verifyCookie } from '@/lib/cookie-signature';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('infinity-gym-auth');
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const data = await verifyCookie(cookie.value);
  if (!data?.username || !data?.role) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    username: data.username,
    role: data.role,
    supabaseUserId: data.supabaseUserId || null,
  });
}

function setCookieHeader(response: NextResponse, value: string, request: NextRequest) {
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=${encodeURIComponent(value)}; path=/; max-age=86400; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

function clearCookieHeader(response: NextResponse, request: NextRequest) {
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=; path=/; max-age=0; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, role, supabaseUserId } = body;

  if (!username || !role) {
    return NextResponse.json({ error: 'username and role required' }, { status: 400 });
  }

  const value = await signCookie({ username, role, supabaseUserId });
  const response = NextResponse.json({ success: true });
  setCookieHeader(response, value, request);
  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearCookieHeader(response, request);
  return response;
}
