import { NextRequest, NextResponse } from 'next/server';
import { withCsrf } from '@/lib/api-middleware';

async function handlePost(request: NextRequest) {
  const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
  const secureFlag = isSecure ? '; Secure' : '';
  const response = NextResponse.json({ success: true });

  response.headers.set(
    'Set-Cookie',
    `infinity-gym-auth=; path=/; max-age=0; HttpOnly; SameSite=Strict${secureFlag}`
  );

  return response;
}

export const POST = withCsrf(handlePost);
