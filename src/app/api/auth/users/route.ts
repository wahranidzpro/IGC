import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdmin } from '@/lib/api-auth';

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
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = getSupabase(true);
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const body = await request.json();
  const { id, username, password, pin, role, name, phone, is_locked } = body;

  if (!id && !username) return NextResponse.json({ error: 'id or username required' }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (username !== undefined) updates.username = username;
  if (password !== undefined) updates.password_hash = bcrypt.hashSync(password, 10);
  if (pin !== undefined) updates.pin = bcrypt.hashSync(pin, 10);
  if (role !== undefined) updates.role = role;
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (is_locked !== undefined) updates.is_locked = is_locked;

  const { data, error } = await (supabase.from('gym_users') as any)
    .update(updates)
    .eq(id ? 'id' : 'username', id || username)
    .select('id, username, role, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data });
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
