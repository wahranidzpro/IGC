-- Migration 023: Sync table for ai_chat_logs
-- Previously local-only, now synced to cloud
-- RLS: member can read own logs, admin/reception can read all

CREATE TABLE IF NOT EXISTS public.synced_ai_chat_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  member_id INTEGER NOT NULL DEFAULT 0,
  member_name TEXT DEFAULT '',
  topic TEXT DEFAULT '',
  query TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_ai_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_synced_ai_chat_logs"
  ON public.synced_ai_chat_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_read_synced_ai_chat_logs"
  ON public.synced_ai_chat_logs FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE POLICY "admin_all_synced_ai_chat_logs"
  ON public.synced_ai_chat_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.upsert_synced_ai_chat_log(
  p_local_id INTEGER,
  p_member_id INTEGER DEFAULT 0,
  p_member_name TEXT DEFAULT '',
  p_topic TEXT DEFAULT '',
  p_query TEXT DEFAULT '',
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
  FROM public.synced_ai_chat_logs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_ai_chat_logs (
    local_id, member_id, member_name, topic, query, updated_at
  ) VALUES (
    v_resolved_id, p_member_id, p_member_name, p_topic, p_query, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    member_id = EXCLUDED.member_id,
    member_name = EXCLUDED.member_name,
    topic = EXCLUDED.topic,
    query = EXCLUDED.query,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_ai_chat_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
