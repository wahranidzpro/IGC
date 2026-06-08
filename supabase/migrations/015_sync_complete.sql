-- Migration 015: Complete sync for coaches, expenses, private sessions, events + fix Realtime publication
-- Ajoute 5 nouvelles tables synced_* avec leurs RPC + ajoute les tables manquantes à supabase_realtime

-- ============================================================
-- 1. synced_coaches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_coaches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  availability JSONB DEFAULT '[]',
  program_ids JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_coaches"
  ON public.synced_coaches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_coaches"
  ON public.synced_coaches FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.upsert_synced_coach(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_availability JSONB DEFAULT '[]',
  p_program_ids JSONB DEFAULT '[]',
  p_is_active BOOLEAN DEFAULT true,
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
  FROM public.synced_coaches
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_coaches WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_coaches;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_coaches (
    local_id, name, phone, availability, program_ids, is_active, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_phone, p_availability, p_program_ids, p_is_active, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    availability = EXCLUDED.availability,
    program_ids = EXCLUDED.program_ids,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 2. synced_expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  category TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_expenses"
  ON public.synced_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_expenses"
  ON public.synced_expenses FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_expenses"
  ON public.synced_expenses FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_expense(
  p_local_id INTEGER,
  p_category TEXT DEFAULT '',
  p_amount NUMERIC DEFAULT 0,
  p_date TIMESTAMPTZ DEFAULT NOW(),
  p_description TEXT DEFAULT '',
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
  FROM public.synced_expenses
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_expenses WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_expenses;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_expenses (
    local_id, category, amount, date, description, updated_at
  ) VALUES (
    v_resolved_id, p_category, p_amount, p_date, p_description, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    category = EXCLUDED.category,
    amount = EXCLUDED.amount,
    date = EXCLUDED.date,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 3. synced_private_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_private_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER DEFAULT 0,
  member_name TEXT DEFAULT '',
  coach_id INTEGER DEFAULT 0,
  coach_name TEXT DEFAULT '',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  duration INTEGER DEFAULT 60,
  price NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_private_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_private_sessions"
  ON public.synced_private_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_private_sessions"
  ON public.synced_private_sessions FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_private_sessions"
  ON public.synced_private_sessions FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_read_own_synced_private_sessions"
  ON public.synced_private_sessions FOR SELECT
  TO authenticated
  USING (get_user_role() = 'coach');

CREATE OR REPLACE FUNCTION public.upsert_synced_private_session(
  p_local_id INTEGER,
  p_member_id INTEGER DEFAULT 0,
  p_member_name TEXT DEFAULT '',
  p_coach_id INTEGER DEFAULT 0,
  p_coach_name TEXT DEFAULT '',
  p_date TEXT DEFAULT '',
  p_time TEXT DEFAULT '',
  p_duration INTEGER DEFAULT 60,
  p_price NUMERIC DEFAULT 0,
  p_status TEXT DEFAULT 'pending',
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
  FROM public.synced_private_sessions
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_private_sessions WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_private_sessions;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_private_sessions (
    local_id, member_id, member_name, coach_id, coach_name,
    date, time, duration, price, status, updated_at
  ) VALUES (
    v_resolved_id, p_member_id, p_member_name, p_coach_id, p_coach_name,
    p_date, p_time, p_duration, p_price, p_status, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    member_id = EXCLUDED.member_id,
    member_name = EXCLUDED.member_name,
    coach_id = EXCLUDED.coach_id,
    coach_name = EXCLUDED.coach_name,
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    duration = EXCLUDED.duration,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 4. synced_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  type TEXT DEFAULT 'event',
  date TEXT DEFAULT '',
  price NUMERIC(10,2) DEFAULT 0,
  location TEXT DEFAULT '',
  max_participants INTEGER DEFAULT 30,
  participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_events"
  ON public.synced_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_events"
  ON public.synced_events FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_events"
  ON public.synced_events FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_event(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_type TEXT DEFAULT 'event',
  p_date TEXT DEFAULT '',
  p_price NUMERIC DEFAULT 0,
  p_location TEXT DEFAULT '',
  p_max_participants INTEGER DEFAULT 30,
  p_participants INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'open',
  p_description TEXT DEFAULT '',
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
  FROM public.synced_events
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_events WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_events;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_events (
    local_id, name, type, date, price, location,
    max_participants, participants, status, description, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_type, p_date, p_price, p_location,
    p_max_participants, p_participants, p_status, p_description, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    date = EXCLUDED.date,
    price = EXCLUDED.price,
    location = EXCLUDED.location,
    max_participants = EXCLUDED.max_participants,
    participants = EXCLUDED.participants,
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 5. synced_event_registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_event_registrations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  event_id INTEGER DEFAULT 0,
  event_name TEXT DEFAULT '',
  member_id INTEGER DEFAULT 0,
  member_name TEXT DEFAULT '',
  amount_paid NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_event_registrations"
  ON public.synced_event_registrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_event_registrations"
  ON public.synced_event_registrations FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_event_registrations"
  ON public.synced_event_registrations FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_event_registration(
  p_local_id INTEGER,
  p_event_id INTEGER DEFAULT 0,
  p_event_name TEXT DEFAULT '',
  p_member_id INTEGER DEFAULT 0,
  p_member_name TEXT DEFAULT '',
  p_amount_paid NUMERIC DEFAULT 0,
  p_status TEXT DEFAULT 'registered',
  p_registered_at TIMESTAMPTZ DEFAULT NOW(),
  p_checked_in_at TIMESTAMPTZ DEFAULT NULL,
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
  FROM public.synced_event_registrations
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_event_registrations WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_event_registrations;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_event_registrations (
    local_id, event_id, event_name, member_id, member_name,
    amount_paid, status, registered_at, checked_in_at, updated_at
  ) VALUES (
    v_resolved_id, p_event_id, p_event_name, p_member_id, p_member_name,
    p_amount_paid, p_status, p_registered_at, p_checked_in_at, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    event_id = EXCLUDED.event_id,
    event_name = EXCLUDED.event_name,
    member_id = EXCLUDED.member_id,
    member_name = EXCLUDED.member_name,
    amount_paid = EXCLUDED.amount_paid,
    status = EXCLUDED.status,
    registered_at = EXCLUDED.registered_at,
    checked_in_at = EXCLUDED.checked_in_at,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 6. Fix Realtime publication — add missing tables
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_payments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_checkins;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_points_ledger;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new tables to publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_coaches;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_expenses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_private_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_event_registrations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
