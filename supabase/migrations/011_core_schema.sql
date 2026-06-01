-- ============================================================
-- Migration 011: Core Application Schema
-- Creates the 8 main domain tables used by the application:
--   profiles, clubs, members, memberships, payments,
--   attendance, devices, qr_tokens
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'reception', 'coach', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_type AS ENUM ('monthly', 'quarterly', 'yearly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'mobile_money');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_category AS ENUM ('subscription', 'registration', 'product', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE device_type AS ENUM ('turnstile', 'scanner', 'tablet', 'gate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE device_direction AS ENUM ('entry', 'exit', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_type AS ENUM ('entry', 'exit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_method AS ENUM ('rfid', 'qr', 'manual', 'pin', 'facial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  device_fingerprint TEXT,
  device_locked BOOLEAN NOT NULL DEFAULT false,
  transfer_otp TEXT,
  transfer_otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CLUBS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  opening_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  rfid_code TEXT,
  birth_date TEXT,
  gender TEXT,
  blood_type TEXT,
  weight NUMERIC(5,2),
  height NUMERIC(5,2),
  emergency_contact TEXT,
  emergency_phone TEXT,
  fitness_goal TEXT,
  experience_level TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status member_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- 5. DEVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type device_type NOT NULL,
  direction device_direction,
  ip_address TEXT,
  port INTEGER,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  firmware TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. MEMBERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  type membership_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  sessions_total INTEGER,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL,
  status membership_status NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  method payment_method NOT NULL,
  category payment_category NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  type attendance_type NOT NULL,
  method attendance_method NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. QR TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint ON public.profiles(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_members_profile_id ON public.members(profile_id);
CREATE INDEX IF NOT EXISTS idx_members_club_id ON public.members(club_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_rfid_code ON public.members(rfid_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_profile_id_unique ON public.members(profile_id);
CREATE INDEX IF NOT EXISTS idx_devices_club_id ON public.devices(club_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON public.devices(type);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_member_status ON public.memberships(member_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_membership_id ON public.payments(membership_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_device_id ON public.attendance(device_id);
CREATE INDEX IF NOT EXISTS idx_attendance_club_id ON public.attendance(club_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_member_timestamp ON public.attendance(member_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON public.qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_member_id ON public.qr_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_is_used ON public.qr_tokens(is_used);

-- ============================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;

-- Reuse existing get_user_role() from migration 002

-- PROFILES RLS
CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "user_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "service_role_all_profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "staff_read_profiles" ON public.profiles
  FOR SELECT USING (get_user_role() IN ('admin', 'reception', 'coach'));

-- CLUBS RLS
CREATE POLICY "admin_all_clubs" ON public.clubs
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "authenticated_read_clubs" ON public.clubs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all_clubs" ON public.clubs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MEMBERS RLS
CREATE POLICY "admin_all_members" ON public.members
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_members" ON public.members
  FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_read_members" ON public.members
  FOR SELECT USING (get_user_role() IN ('admin', 'reception', 'coach'));
CREATE POLICY "user_read_own_member" ON public.members
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "service_role_all_members" ON public.members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- DEVICES RLS
CREATE POLICY "admin_all_devices" ON public.devices
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "authenticated_read_devices" ON public.devices
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "service_role_all_devices" ON public.devices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MEMBERSHIPS RLS
CREATE POLICY "admin_all_memberships" ON public.memberships
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_memberships" ON public.memberships
  FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_read_memberships" ON public.memberships
  FOR SELECT USING (get_user_role() IN ('admin', 'reception', 'coach'));
CREATE POLICY "user_read_own_memberships" ON public.memberships
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_memberships" ON public.memberships
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PAYMENTS RLS
CREATE POLICY "admin_all_payments" ON public.payments
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_payments" ON public.payments
  FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_read_payments" ON public.payments
  FOR SELECT USING (get_user_role() IN ('admin', 'reception', 'coach'));
CREATE POLICY "user_read_own_payments" ON public.payments
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_payments" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ATTENDANCE RLS
CREATE POLICY "admin_all_attendance" ON public.attendance
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_attendance" ON public.attendance
  FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_read_attendance" ON public.attendance
  FOR SELECT USING (get_user_role() IN ('admin', 'reception', 'coach'));
CREATE POLICY "user_read_own_attendance" ON public.attendance
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_attendance" ON public.attendance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- QR TOKENS RLS
CREATE POLICY "admin_all_qr_tokens" ON public.qr_tokens
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "user_manage_own_qr_tokens" ON public.qr_tokens
  FOR ALL USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_qr_tokens" ON public.qr_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 12. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 13. ENABLE REALTIME
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_tokens;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
