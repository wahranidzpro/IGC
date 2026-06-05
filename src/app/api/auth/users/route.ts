import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdmin, verifyAuthenticated } from '@/lib/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getSupabase(useServiceRole = true) {
  if (!supabaseUrl) return null;
  if (useServiceRole && supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = getSupabase(true);
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured', users: [] }, { status: 503 });

  const { data, error } = await supabase.from('gym_users').select('id, username, role, name, phone, is_locked, created_at').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message, users: [] }, { status: 500 });

  return NextResponse.json({ users: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = getSupabase(true);
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const body = await request.json();
  const { username, password, pin, role, name, phone } = body;

  if (!username || !password || !pin || !role || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: existing } = await supabase.from('gym_users').select('id').eq('username', username).maybeSingle();
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });

  const passwordHash = bcrypt.hashSync(password, 10);
  const pinHash = bcrypt.hashSync(pin, 10);

  const { data, error } = await supabase.from('gym_users').insert([{
    username, password_hash: passwordHash, pin: pinHash, role, name,
    phone: phone || null, is_locked: false,
  }]).select('id, username, role, name').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabase(true);
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const body = await request.json();
  const { id, username, password, currentPassword, pin, role, name, phone, is_locked } = body;

  // ── Auto-change: user changes own password ──
  if (currentPassword) {
    console.log('[PATCH] auto-change: currentPassword present');
    const auth = await verifyAuthenticated(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (!password) return NextResponse.json({ error: 'New password required' }, { status: 400 });

    const { data: user } = await supabase.from('gym_users')
      .select('id, username, password_hash, auth_user_id, role, name')
      .eq('username', auth.username)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isHashed = user.password_hash?.startsWith('$2a$') || user.password_hash?.startsWith('$2b$') || user.password_hash?.startsWith('$2$');
    const valid = isHashed
      ? await bcrypt.compare(currentPassword, user.password_hash)
      : currentPassword === user.password_hash;
    if (!valid) return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });

    const newHash = bcrypt.hashSync(password, 10);
    console.log('[PATCH] auto-change: updating gym_users for', user.username);
    const { error: updateError } = await supabase.from('gym_users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (user.auth_user_id) {
      console.log('[PATCH] auto-change: syncing Supabase Auth for', user.auth_user_id);
      try {
        const { error: authError } = await supabase.auth.admin.updateUserById(user.auth_user_id, { password });
        if (authError) console.error('[PATCH] Failed to update Supabase Auth:', authError.message);
      } catch (err) {
        console.error('[PATCH] Exception updating Supabase Auth:', err);
      }
    } else {
      console.log('[PATCH] auto-change: creating Supabase Auth user for', user.username);
      const email = `${user.username}@infinitygym.local`;
      try {
        const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { username: user.username, role: user.role, name: user.name || user.username },
        });
        if (authCreateError) console.error('[PATCH] Failed to create Supabase Auth:', authCreateError.message);
        else if (authData?.user) {
          const { error: linkError } = await supabase.from('gym_users')
            .update({ auth_user_id: authData.user.id, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          if (linkError) console.error('[PATCH] Failed to link auth_user_id:', linkError.message);
          else console.log('[PATCH] Created & linked Supabase Auth user:', authData.user.id);
        }
      } catch (err) {
        console.error('[PATCH] Exception creating Supabase Auth:', err);
      }
    }

    return NextResponse.json({ user: { id: user.id, username: user.username } });
  }

  // ── Admin changes another user's password ──
  const admin = await verifyAdmin(request);
  if (!admin.authorized) return NextResponse.json({ error: admin.error }, { status: 401 });

  if (!id && !username) return NextResponse.json({ error: 'id or username required' }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (username !== undefined) updates.username = username;
  if (password) {
    console.log('[PATCH] admin: hashing password');
    updates.password_hash = bcrypt.hashSync(password, 10);
  }
  if (pin !== undefined) updates.pin = bcrypt.hashSync(pin, 10);
  if (role !== undefined) updates.role = role;
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (is_locked !== undefined) updates.is_locked = is_locked;

  console.log('[PATCH] admin: updating gym_users', id || username);
  const { data: updated, error } = await (supabase.from('gym_users') as any)
    .update(updates)
    .eq(id ? 'id' : 'username', id || username)
    .select('id, username, role, name')
    .single();

  if (error) {
    console.error('[PATCH] admin: update error', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[PATCH] admin: update successful for', updated?.username, 'password changed:', !!password);

  // Sync Supabase Auth when admin changes password
  if (password && updated?.id) {
    console.log('[PATCH] admin: looking up auth_user_id for', updated.id);
    try {
      const { data: userWithAuth } = await supabase.from('gym_users')
        .select('auth_user_id')
        .eq('id', updated.id)
        .maybeSingle();
      console.log('[PATCH] admin: auth_user_id found:', !!userWithAuth?.auth_user_id);
      if (userWithAuth?.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.updateUserById(userWithAuth.auth_user_id, { password });
        if (authError) console.error('[PATCH] Failed to update Supabase Auth:', authError.message);
        else console.log('[PATCH] admin: Supabase Auth updated successfully');
      } else {
        console.log('[PATCH] admin: creating Supabase Auth user for admin-updated user');
        const email = `${updated.username}@infinitygym.local`;
        const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { username: updated.username, role: (body.role || updated.role) as string, name: (body.name || updated.name) as string },
        });
        if (authCreateError) console.error('[PATCH] Failed to create Supabase Auth:', authCreateError.message);
        else if (authData?.user) {
          const { error: linkError } = await supabase.from('gym_users')
            .update({ auth_user_id: authData.user.id, updated_at: new Date().toISOString() })
            .eq('id', updated.id);
          if (linkError) console.error('[PATCH] Failed to link auth_user_id:', linkError.message);
          else console.log('[PATCH] Created & linked Supabase Auth user for admin update:', authData.user.id);
        }
      }
    } catch (err) {
      console.error('[PATCH] Exception updating Supabase Auth:', err);
    }
  }

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = getSupabase(true);
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const username = searchParams.get('username');

  if (!id && !username) return NextResponse.json({ error: 'id or username required' }, { status: 400 });

  const { error } = await (supabase.from('gym_users') as any)
    .delete()
    .eq(id ? 'id' : 'username', id || username);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
