import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const sb = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await sb.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non connecté. Connectez-vous d\'abord.' },
        { status: 401 }
      );
    }

    const currentRole = user.user_metadata?.role;
    if (currentRole === 'admin') {
      return NextResponse.json({
        message: 'Vous êtes déjà admin !',
        redirect: '/admin',
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key non configurée sur le serveur.' },
        { status: 503 }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { user_metadata: { ...user.user_metadata, role: 'admin' } }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await serviceClient.from('gym_users').upsert({
      username: user.email?.replace('@infinitygym.local', '').replace('@gmail.com', '').replace('@', '-') || user.id,
      role: 'admin',
      name: user.user_metadata?.name || user.email || 'Admin',
      auth_user_id: user.id,
      is_locked: false,
    }, { onConflict: 'auth_user_id' });

    return NextResponse.json({
      success: true,
      message: 'Félicitations ! Vous êtes maintenant admin. Déconnectez-vous et reconnectez-vous pour accéder à /admin.',
      redirect: '/login',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
