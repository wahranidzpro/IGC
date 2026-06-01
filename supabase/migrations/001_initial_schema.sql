-- Infinity Gym Supabase Migration Script
-- Run this in your Supabase SQL Editor to set up all required tables

-- =====================================================
-- 0. AUTH TABLES (Centralized authentication)
-- =====================================================

CREATE TABLE IF NOT EXISTS gym_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reception', 'coach', 'adherent')),
  name TEXT NOT NULL,
  phone TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gym_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gym_users_public_read" ON gym_users FOR SELECT USING (true);
CREATE POLICY "gym_users_public_insert" ON gym_users FOR INSERT WITH CHECK (true);
CREATE POLICY "gym_users_public_update" ON gym_users FOR UPDATE USING (true);
CREATE POLICY "gym_users_public_delete" ON gym_users FOR DELETE USING (true);

-- =====================================================
-- 1. SYNC TABLES (Dexie → Supabase sync)
-- =====================================================

CREATE TABLE IF NOT EXISTS synced_members (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT NOT NULL,
  birth_date TEXT,
  address TEXT,
  gender TEXT,
  blood_type TEXT,
  photo TEXT,
  program_id INTEGER,
  sessions_left INTEGER,
  program_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  balance_due DECIMAL(10,2),
  discount DECIMAL(10,2),
  advance DECIMAL(10,2),
  subscription_type TEXT,
  subscription_duration TEXT,
  status TEXT,
  fidelity_points INTEGER,
  rfid_code TEXT,
  coach_id INTEGER,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  allergies TEXT,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  fitness_goal TEXT,
  experience_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS synced_payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER,
  amount DECIMAL(10,2),
  type TEXT,
  mode TEXT,
  date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS synced_checkins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER,
  timestamp TIMESTAMPTZ,
  type TEXT DEFAULT 'checkin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS synced_points_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER,
  points INTEGER,
  type TEXT,
  reference_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS synced_pin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for sync tables
ALTER TABLE synced_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_pin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_synced_pin_users" ON synced_pin_users FOR ALL USING (true);
CREATE POLICY "service_role_synced_members" ON synced_members FOR ALL USING (true);
CREATE POLICY "service_role_synced_payments" ON synced_payments FOR ALL USING (true);
CREATE POLICY "service_role_synced_checkins" ON synced_checkins FOR ALL USING (true);
CREATE POLICY "service_role_synced_points_ledger" ON synced_points_ledger FOR ALL USING (true);
CREATE POLICY "service_role_sync_logs" ON sync_logs FOR ALL USING (true);

-- =====================================================
-- 2. TURNSTILE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS turnstiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER DEFAULT 80,
  device_type TEXT NOT NULL,
  direction TEXT DEFAULT 'both',
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turnstile_members (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_local_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  rfid_code TEXT,
  qr_code TEXT,
  access_level TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  turnstile_id BIGINT REFERENCES turnstiles(id),
  member_local_id INTEGER,
  event_type TEXT NOT NULL,
  access_granted BOOLEAN,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_local_id INTEGER NOT NULL,
  turnstile_id BIGINT REFERENCES turnstiles(id),
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS device_heartbeats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  turnstile_id BIGINT REFERENCES turnstiles(id),
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  turnstile_id BIGINT REFERENCES turnstiles(id),
  action TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- RLS policies for turnstile tables
ALTER TABLE turnstiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnstile_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_turnstiles" ON turnstiles FOR ALL USING (true);
CREATE POLICY "service_role_turnstile_members" ON turnstile_members FOR ALL USING (true);
CREATE POLICY "service_role_access_logs" ON access_logs FOR ALL USING (true);
CREATE POLICY "service_role_active_sessions" ON active_sessions FOR ALL USING (true);
CREATE POLICY "service_role_device_heartbeats" ON device_heartbeats FOR ALL USING (true);
CREATE POLICY "service_role_sync_queue" ON sync_queue FOR ALL USING (true);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION check_member_access(member_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  member_status TEXT;
BEGIN
  SELECT status INTO member_status FROM synced_members WHERE local_id = member_id;
  RETURN member_status IN ('active', 'inactive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_entry(
  p_turnstile_id BIGINT,
  p_member_local_id INTEGER,
  p_access_granted BOOLEAN,
  p_reason TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO access_logs (turnstile_id, member_local_id, event_type, access_granted, reason)
  VALUES (p_turnstile_id, p_member_local_id, 'entry', p_access_granted, p_reason)
  RETURNING id INTO v_log_id;

  IF p_access_granted THEN
    INSERT INTO active_sessions (member_local_id, turnstile_id)
    VALUES (p_member_local_id, p_turnstile_id);
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_exit(
  p_turnstile_id BIGINT,
  p_member_local_id INTEGER
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO access_logs (turnstile_id, member_local_id, event_type, access_granted, reason)
  VALUES (p_turnstile_id, p_member_local_id, 'exit', true, 'normal_exit')
  RETURNING id INTO v_log_id;

  UPDATE active_sessions
  SET exit_time = NOW(), is_active = false
  WHERE member_local_id = p_member_local_id AND is_active = true;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_synced_members_local_id ON synced_members(local_id);
CREATE INDEX IF NOT EXISTS idx_synced_members_phone ON synced_members(phone);
CREATE INDEX IF NOT EXISTS idx_synced_members_status ON synced_members(status);
CREATE INDEX IF NOT EXISTS idx_synced_payments_local_id ON synced_payments(local_id);
CREATE INDEX IF NOT EXISTS idx_synced_payments_member_id ON synced_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_synced_checkins_local_id ON synced_checkins(local_id);
CREATE INDEX IF NOT EXISTS idx_synced_checkins_member_id ON synced_checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_synced_points_member_id ON synced_points_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_member_id ON access_logs(member_local_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_active_sessions_member_id ON active_sessions(member_local_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_operation ON sync_logs(operation);

-- =====================================================
-- Migration complete
-- =====================================================
