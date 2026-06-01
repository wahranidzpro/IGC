-- Migration 007: RFID Access Control (turnstile + card management)

-- ============================================
-- 1. Add columns to access_logs
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'rfid_uid') THEN
    ALTER TABLE public.access_logs ADD COLUMN rfid_uid TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'method') THEN
    ALTER TABLE public.access_logs ADD COLUMN method TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'status') THEN
    ALTER TABLE public.access_logs ADD COLUMN status TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'raw_payload') THEN
    ALTER TABLE public.access_logs ADD COLUMN raw_payload JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'turnstile_name') THEN
    ALTER TABLE public.access_logs ADD COLUMN turnstile_name TEXT;
  END IF;
END $$;

-- ============================================
-- 2. Create blocked_cards table
-- ============================================

CREATE TABLE IF NOT EXISTS public.blocked_cards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rfid_uid TEXT UNIQUE NOT NULL,
  member_local_id INTEGER,
  reason TEXT,
  blocked_by TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  unblocked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 3. Add rfid_uid to turnstile_members
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'turnstile_members' AND column_name = 'rfid_uid') THEN
    ALTER TABLE public.turnstile_members ADD COLUMN rfid_uid TEXT UNIQUE;
  END IF;
END $$;

-- ============================================
-- 4. Create access_restrictions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.access_restrictions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_local_id INTEGER NOT NULL,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  is_blackout BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Create check_rfid_access function
-- ============================================

CREATE OR REPLACE FUNCTION public.check_rfid_access(p_rfid_uid TEXT, p_turnstile_id BIGINT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, reason TEXT, member_name TEXT, member_id INTEGER)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_member_local_id INTEGER;
  v_first_name TEXT;
  v_last_name TEXT;
  v_status TEXT;
  v_has_active_session BOOLEAN;
  v_current_day INTEGER;
  v_current_time TIME;
BEGIN
  -- Check blocked_cards first
  IF EXISTS (SELECT 1 FROM public.blocked_cards WHERE rfid_uid = p_rfid_uid AND is_active = true) THEN
    RETURN QUERY SELECT false, 'CARD_BLOCKED'::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- Look up member by rfid_uid
  SELECT tm.member_local_id, tm.first_name, tm.last_name
  INTO v_member_local_id, v_first_name, v_last_name
  FROM public.turnstile_members tm
  WHERE tm.rfid_uid = p_rfid_uid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'CARD_NOT_FOUND'::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check synced_members status
  SELECT sm.status INTO v_status
  FROM public.synced_members sm
  WHERE sm.local_id = v_member_local_id;

  IF v_status IS NULL OR v_status = 'inactive' THEN
    RETURN QUERY SELECT false, 'MEMBER_INACTIVE'::TEXT, NULL::TEXT, v_member_local_id;
    RETURN;
  END IF;

  IF v_status != 'active' THEN
    RETURN QUERY SELECT false, 'SUBSCRIPTION_EXPIRED'::TEXT, NULL::TEXT, v_member_local_id;
    RETURN;
  END IF;

  -- Check access_restrictions
  v_current_day := EXTRACT(DOW FROM NOW())::INTEGER;
  v_current_time := NOW()::TIME;

  -- Check blackout periods
  IF EXISTS (
    SELECT 1 FROM public.access_restrictions ar
    WHERE ar.member_local_id = v_member_local_id
      AND ar.is_blackout = true
      AND (ar.day_of_week IS NULL OR ar.day_of_week = v_current_day)
      AND (ar.start_time IS NULL OR ar.start_time <= v_current_time)
      AND (ar.end_time IS NULL OR ar.end_time >= v_current_time)
  ) THEN
    RETURN QUERY SELECT false, 'TIME_BLACKOUT'::TEXT, v_first_name || ' ' || v_last_name, v_member_local_id;
    RETURN;
  END IF;

  -- Check allow-only restrictions (non-blackout)
  IF EXISTS (SELECT 1 FROM public.access_restrictions ar WHERE ar.member_local_id = v_member_local_id AND ar.is_blackout = false) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.access_restrictions ar
      WHERE ar.member_local_id = v_member_local_id
        AND ar.is_blackout = false
        AND (ar.day_of_week IS NULL OR ar.day_of_week = v_current_day)
        AND (ar.start_time IS NULL OR ar.start_time <= v_current_time)
        AND (ar.end_time IS NULL OR ar.end_time >= v_current_time)
    ) THEN
      RETURN QUERY SELECT false, 'OUTSIDE_ALLOWED_HOURS'::TEXT, v_first_name || ' ' || v_last_name, v_member_local_id;
      RETURN;
    END IF;
  END IF;

  -- Anti-passback: check active sessions
  SELECT EXISTS(
    SELECT 1 FROM public.active_sessions
    WHERE member_local_id = v_member_local_id AND is_active = true
  ) INTO v_has_active_session;

  IF v_has_active_session THEN
    RETURN QUERY SELECT false, 'ANTIPASSBACK'::TEXT, v_first_name || ' ' || v_last_name, v_member_local_id;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'ACCESS_GRANTED'::TEXT, v_first_name || ' ' || v_last_name, v_member_local_id;
END;
$$;

-- ============================================
-- 6. Create log_rfid_access function
-- ============================================

CREATE OR REPLACE FUNCTION public.log_rfid_access(
  p_rfid_uid TEXT,
  p_turnstile_id BIGINT,
  p_status TEXT,
  p_reason TEXT,
  p_method TEXT DEFAULT 'rfid'
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_log_id BIGINT;
  v_member_local_id INTEGER;
  v_turnstile_name TEXT;
BEGIN
  SELECT member_local_id INTO v_member_local_id FROM public.turnstile_members WHERE rfid_uid = p_rfid_uid;
  SELECT name INTO v_turnstile_name FROM public.turnstiles WHERE id = p_turnstile_id;

  INSERT INTO public.access_logs (
    turnstile_id, member_local_id, event_type, access_granted, reason,
    rfid_uid, method, status, turnstile_name
  ) VALUES (
    p_turnstile_id, v_member_local_id, 'rfid_access',
    CASE WHEN p_status = 'allowed' THEN true ELSE false END,
    p_reason, p_rfid_uid, p_method, p_status, v_turnstile_name
  )
  RETURNING id INTO v_log_id;

  IF p_status = 'allowed' AND v_member_local_id IS NOT NULL THEN
    INSERT INTO public.active_sessions (member_local_id, turnstile_id)
    VALUES (v_member_local_id, p_turnstile_id);
  END IF;

  RETURN v_log_id;
END;
$$;

-- ============================================
-- 7. RLS policies for new tables
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_cards' AND policyname = 'Service role full access blocked_cards') THEN
    ALTER TABLE public.blocked_cards ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role full access blocked_cards" ON public.blocked_cards FOR ALL USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'access_restrictions' AND policyname = 'Service role full access access_restrictions') THEN
    ALTER TABLE public.access_restrictions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role full access access_restrictions" ON public.access_restrictions FOR ALL USING (true);
  END IF;
END $$;

-- ============================================
-- 8. Enable Realtime for access_logs and blocked_cards
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'access_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'blocked_cards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_cards;
  END IF;
END $$;

-- ============================================
-- 9. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_access_logs_rfid_uid ON public.access_logs(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_access_logs_status ON public.access_logs(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_method ON public.access_logs(method);
CREATE INDEX IF NOT EXISTS idx_blocked_cards_rfid_uid ON public.blocked_cards(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_access_restrictions_member ON public.access_restrictions(member_local_id);
CREATE INDEX IF NOT EXISTS idx_turnstile_members_rfid_uid ON public.turnstile_members(rfid_uid);
