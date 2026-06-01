import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function verifyAdmin(
  request: NextRequest
): Promise<{ authorized: boolean; role?: string; error?: string }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const role = user.user_metadata?.role as string | undefined;
  if (!role) {
    return { authorized: false, error: 'Role not found in user metadata' };
  }

  if (role === 'admin') return { authorized: true, role: 'admin' };

  return { authorized: false, error: 'Admin access required' };
}

export async function verifyAuthenticated(
  request: NextRequest
): Promise<{
  authorized: boolean;
  username?: string;
  role?: string;
  error?: string;
}> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const username = user.email?.replace('@infinitygym.local', '') ?? (user.user_metadata?.username as string | undefined);
  const role = user.user_metadata?.role as string | undefined;

  if (!username || !role) {
    return { authorized: false, error: 'User metadata incomplete' };
  }

  return { authorized: true, username, role };
}
