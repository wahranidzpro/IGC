-- Migration 024: Sync tables for settings + pin_users in Realtime
-- Settings were previously local-only
-- pin_users already has synced table but missing Realtime publication

-- ============================================
-- 1. synced_settings
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  key TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_settings"
  ON public.synced_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_settings"
  ON public.synced_settings FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.upsert_synced_setting(
  p_local_id INTEGER,
  p_key TEXT DEFAULT '',
  p_value TEXT DEFAULT '',
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
  FROM public.synced_settings
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_settings (
    local_id, key, value, updated_at
  ) VALUES (
    v_resolved_id, p_key, p_value, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    key = EXCLUDED.key,
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. Add synced_pin_users to Realtime publication
-- (table already exists from migration 001)
-- ============================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_pin_users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. Add sync_logs to Realtime publication
-- ============================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
