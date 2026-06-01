import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdmin } from '@/lib/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 503 });
  }

  const body = await request.json();
  const { username, password, pin, role, name, phone } = body;

  if (!username || !password || !role || !name) {
    return NextResponse.json({ error: 'Missing required fields: username, password, role, name' }, { status: 400 });
  }

  const validRoles = ['admin', 'reception', 'coach', 'adherent'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be: admin, reception, coach, or adherent' }, { status: 400 });
  }

  try {
    const email = `${username}@infinitygym.local`;

    const { data: existingUser } = await supabase
      .from('gym_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role, name, pin: pin || '0000' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const pinHash = bcrypt.hashSync(pin || '0000', 10);
    const { data: gymUser, error: gymError } = await supabase
      .from('gym_users')
      .upsert({
        username,
        password_hash: passwordHash,
        pin: pinHash,
        role,
        name,
        phone: phone || null,
        auth_user_id: authData.user.id,
        is_locked: false,
      })
      .select()
      .single();

    if (gymError) {
      return NextResponse.json({ error: gymError.message }, { status: 500 });
    }

    await supabase.from('subscriptions').upsert({
      user_id: authData.user.id,
      status: 'active',
      plan_name: role === 'admin' ? 'Administrateur' : 'Standard',
    });

    await supabase.from('memberships_control').upsert({
      user_id: authData.user.id,
      approved_by_admin: role === 'admin',
      approved_by_reception: role === 'admin' || role === 'reception',
      approved_by_admin_at: role === 'admin' ? new Date().toISOString() : null,
      approved_by_reception_at: role === 'admin' || role === 'reception' ? new Date().toISOString() : null,
      approved_by_admin_id: role === 'admin' ? authData.user.id : null,
      approved_by_reception_id: role === 'admin' || role === 'reception' ? authData.user.id : null,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: gymUser.id,
        username: gymUser.username,
        role: gymUser.role,
        name: gymUser.name,
        auth_user_id: authData.user.id,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
