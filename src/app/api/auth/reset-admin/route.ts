import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const RESET_SECRET = process.env.RESET_SECRET || '';

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  console.log('[RESET] POST received');

  if (!RESET_SECRET) {
    console.error('[RESET] RESET_SECRET not configured');
    return NextResponse.json({ error: 'Reset secret not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { username, newPassword, secret } = body;

  if (!username || !newPassword || !secret) {
    return NextResponse.json({ error: 'username, newPassword and secret required' }, { status: 400 });
  }

  if (secret !== RESET_SECRET) {
    console.error('[RESET] Invalid secret');
    return NextResponse.json({ error: 'Invalid reset secret' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: user, error } = await supabase
    .from('gym_users')
    .select('id, username, role, auth_user_id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('[RESET] DB error:', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!user) {
    console.error('[RESET] User not found:', username);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  console.log('[RESET] Resetting password for:', username, 'auth_user_id:', user.auth_user_id);

  const newHash = bcrypt.hashSync(newPassword, 10);
  const { error: updateError } = await supabase
    .from('gym_users')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('[RESET] Update error:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log('[RESET] gym_users.password_hash updated');

  if (user.auth_user_id) {
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(user.auth_user_id, { password: newPassword });
      if (authError) {
        console.error('[RESET] Supabase Auth update error:', authError.message);
      } else {
        console.log('[RESET] Supabase Auth password synced');
      }
    } catch (err) {
      console.error('[RESET] Exception updating Supabase Auth:', err);
    }
  }

  console.log('[RESET] Password reset complete for:', username);
  return NextResponse.json({ success: true, message: `Password reset for ${username}` });
}
