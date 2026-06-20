-- Migration 025: Sync tables for queue-only entities (coach modules)
-- These entities are written by the offline queue to direct tables
-- but need synced_ tables for proper pull/cache between devices.
-- Tables: workout_programs, nutrition_programs, schedules,
-- progress_logs, access_logs, profiles, club_info

-- ============================================
-- 1. synced_workout_programs
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_workout_programs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  coach_id INTEGER DEFAULT 0,
  member_id INTEGER DEFAULT 0,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  exercises TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_workout_programs"
  ON public.synced_workout_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_workout_programs"
  ON public.synced_workout_programs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_workout_programs"
  ON public.synced_workout_programs FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_all_synced_workout_programs"
  ON public.synced_workout_programs FOR ALL
  TO authenticated
  USING (get_user_role() = 'coach');

CREATE OR REPLACE FUNCTION public.upsert_synced_workout_program(
  p_local_id INTEGER,
  p_coach_id INTEGER DEFAULT 0,
  p_member_id INTEGER DEFAULT 0,
  p_name TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_exercises TEXT DEFAULT '[]',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_workout_programs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_workout_programs (
    local_id, coach_id, member_id, name, description, exercises, updated_at
  ) VALUES (
    v_resolved_id, p_coach_id, p_member_id, p_name, p_description, p_exercises, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    coach_id = EXCLUDED.coach_id,
    member_id = EXCLUDED.member_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    exercises = EXCLUDED.exercises,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 2. synced_nutrition_programs
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_nutrition_programs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  coach_id INTEGER DEFAULT 0,
  member_id INTEGER DEFAULT 0,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  meals TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_nutrition_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_nutrition_programs"
  ON public.synced_nutrition_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_nutrition_programs"
  ON public.synced_nutrition_programs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_nutrition_programs"
  ON public.synced_nutrition_programs FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_all_synced_nutrition_programs"
  ON public.synced_nutrition_programs FOR ALL
  TO authenticated
  USING (get_user_role() = 'coach');

CREATE OR REPLACE FUNCTION public.upsert_synced_nutrition_program(
  p_local_id INTEGER,
  p_coach_id INTEGER DEFAULT 0,
  p_member_id INTEGER DEFAULT 0,
  p_name TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_meals TEXT DEFAULT '[]',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_nutrition_programs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_nutrition_programs (
    local_id, coach_id, member_id, name, description, meals, updated_at
  ) VALUES (
    v_resolved_id, p_coach_id, p_member_id, p_name, p_description, p_meals, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    coach_id = EXCLUDED.coach_id,
    member_id = EXCLUDED.member_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    meals = EXCLUDED.meals,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 3. synced_schedules
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_schedules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  coach_id INTEGER DEFAULT 0,
  member_id INTEGER DEFAULT 0,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  type TEXT DEFAULT 'appointment',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_schedules"
  ON public.synced_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_schedules"
  ON public.synced_schedules FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_schedules"
  ON public.synced_schedules FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_all_synced_schedules"
  ON public.synced_schedules FOR ALL
  TO authenticated
  USING (get_user_role() = 'coach');

CREATE OR REPLACE FUNCTION public.upsert_synced_schedule(
  p_local_id INTEGER,
  p_coach_id INTEGER DEFAULT 0,
  p_member_id INTEGER DEFAULT 0,
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_type TEXT DEFAULT 'appointment',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_schedules
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_schedules (
    local_id, coach_id, member_id, title, description,
    start_time, end_time, type, updated_at
  ) VALUES (
    v_resolved_id, p_coach_id, p_member_id, p_title, p_description,
    p_start_time, p_end_time, p_type, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    coach_id = EXCLUDED.coach_id,
    member_id = EXCLUDED.member_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    type = EXCLUDED.type,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 4. synced_progress_logs
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_progress_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER DEFAULT 0,
  coach_id INTEGER DEFAULT 0,
  weight DECIMAL,
  body_fat DECIMAL,
  muscle_mass DECIMAL,
  waist_circumference DECIMAL,
  notes TEXT DEFAULT '',
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_progress_logs"
  ON public.synced_progress_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_progress_logs"
  ON public.synced_progress_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_progress_logs"
  ON public.synced_progress_logs FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_all_synced_progress_logs"
  ON public.synced_progress_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'coach');

CREATE OR REPLACE FUNCTION public.upsert_synced_progress_log(
  p_local_id INTEGER,
  p_member_id INTEGER DEFAULT 0,
  p_coach_id INTEGER DEFAULT 0,
  p_weight DECIMAL DEFAULT NULL,
  p_body_fat DECIMAL DEFAULT NULL,
  p_muscle_mass DECIMAL DEFAULT NULL,
  p_waist_circumference DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT '',
  p_logged_at TIMESTAMPTZ DEFAULT NOW(),
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_progress_logs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_progress_logs (
    local_id, member_id, coach_id, weight, body_fat, muscle_mass,
    waist_circumference, notes, logged_at, updated_at
  ) VALUES (
    v_resolved_id, p_member_id, p_coach_id, p_weight, p_body_fat, p_muscle_mass,
    p_waist_circumference, p_notes, p_logged_at, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    member_id = EXCLUDED.member_id,
    coach_id = EXCLUDED.coach_id,
    weight = EXCLUDED.weight,
    body_fat = EXCLUDED.body_fat,
    muscle_mass = EXCLUDED.muscle_mass,
    waist_circumference = EXCLUDED.waist_circumference,
    notes = EXCLUDED.notes,
    logged_at = EXCLUDED.logged_at,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 5. synced_access_logs
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER DEFAULT 0,
  turnstile_id INTEGER,
  event_type TEXT DEFAULT 'entry',
  access_granted BOOLEAN DEFAULT true,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_access_logs"
  ON public.synced_access_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_access_logs"
  ON public.synced_access_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_access_logs"
  ON public.synced_access_logs FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_access_log(
  p_local_id INTEGER,
  p_member_id INTEGER DEFAULT 0,
  p_turnstile_id INTEGER DEFAULT NULL,
  p_event_type TEXT DEFAULT 'entry',
  p_access_granted BOOLEAN DEFAULT true,
  p_reason TEXT DEFAULT '',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_access_logs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_access_logs (
    local_id, member_id, turnstile_id, event_type, access_granted, reason, updated_at
  ) VALUES (
    v_resolved_id, p_member_id, p_turnstile_id, p_event_type, p_access_granted, p_reason, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    member_id = EXCLUDED.member_id,
    turnstile_id = EXCLUDED.turnstile_id,
    event_type = EXCLUDED.event_type,
    access_granted = EXCLUDED.access_granted,
    reason = EXCLUDED.reason,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 6. synced_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  user_id TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_profiles"
  ON public.synced_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_profiles"
  ON public.synced_profiles FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_profiles"
  ON public.synced_profiles FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_profile(
  p_local_id INTEGER,
  p_user_id TEXT DEFAULT '',
  p_full_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_avatar_url TEXT DEFAULT '',
  p_role TEXT DEFAULT 'member',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_profiles
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_profiles (
    local_id, user_id, full_name, phone, avatar_url, role, updated_at
  ) VALUES (
    v_resolved_id, p_user_id, p_full_name, p_phone, p_avatar_url, p_role, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 7. synced_club_info
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_club_info (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  club_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_club_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_club_info"
  ON public.synced_club_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_club_info"
  ON public.synced_club_info FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.upsert_synced_club_info(
  p_local_id INTEGER,
  p_club_name TEXT DEFAULT '',
  p_address TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_logo_url TEXT DEFAULT '',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  SELECT local_id INTO v_resolved_id
  FROM public.synced_club_info
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_club_info (
    local_id, club_name, address, phone, email, logo_url, updated_at
  ) VALUES (
    v_resolved_id, p_club_name, p_address, p_phone, p_email, p_logo_url, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    club_name = EXCLUDED.club_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    logo_url = EXCLUDED.logo_url,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_workout_programs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_nutrition_programs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_schedules;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_progress_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_access_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_club_info;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
