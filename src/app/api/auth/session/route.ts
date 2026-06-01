import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const username = user.email?.replace('@infinitygym.local', '') ?? (user.user_metadata?.username as string | null);
  const role = (user.user_metadata?.role as string | null) ?? 'adherent';

  return NextResponse.json({
    authenticated: true,
    username,
    role,
    supabaseUserId: user.id,
  });
}
