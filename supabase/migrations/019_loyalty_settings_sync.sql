-- Migration 019: Sync for loyaltySettings (bonus config, earn rates, etc.)
-- Table + RPC for upsert_synced_loyalty_setting

CREATE TABLE IF NOT EXISTS public.synced_loyalty_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  key TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_loyalty_settings"
  ON public.synced_loyalty_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_loyalty_settings"
  ON public.synced_loyalty_settings FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_loyalty_settings"
  ON public.synced_loyalty_settings FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_loyalty_setting(
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
  FROM public.synced_loyalty_settings
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_loyalty_settings WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_loyalty_settings;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_loyalty_settings (
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
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_loyalty_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
