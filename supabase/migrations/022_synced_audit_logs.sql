-- Migration 022: Sync table for audit_logs
-- Previously local-only, now synced to cloud

CREATE TABLE IF NOT EXISTS public.synced_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  member_id INTEGER,
  member_name TEXT DEFAULT '',
  old_value TEXT,
  new_value TEXT,
  performed_by TEXT NOT NULL DEFAULT '',
  performed_by_role TEXT DEFAULT '',
  reason TEXT,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_audit_logs"
  ON public.synced_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_audit_logs"
  ON public.synced_audit_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_audit_logs"
  ON public.synced_audit_logs FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_audit_log(
  p_local_id INTEGER,
  p_action TEXT DEFAULT '',
  p_member_id INTEGER DEFAULT NULL,
  p_member_name TEXT DEFAULT '',
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_performed_by TEXT DEFAULT '',
  p_performed_by_role TEXT DEFAULT '',
  p_reason TEXT DEFAULT NULL,
  p_is_suspicious BOOLEAN DEFAULT false,
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
  FROM public.synced_audit_logs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_audit_logs (
    local_id, action, member_id, member_name, old_value, new_value,
    performed_by, performed_by_role, reason, is_suspicious, updated_at
  ) VALUES (
    v_resolved_id, p_action, p_member_id, p_member_name, p_old_value, p_new_value,
    p_performed_by, p_performed_by_role, p_reason, p_is_suspicious, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    action = EXCLUDED.action,
    member_id = EXCLUDED.member_id,
    member_name = EXCLUDED.member_name,
    old_value = EXCLUDED.old_value,
    new_value = EXCLUDED.new_value,
    performed_by = EXCLUDED.performed_by,
    performed_by_role = EXCLUDED.performed_by_role,
    reason = EXCLUDED.reason,
    is_suspicious = EXCLUDED.is_suspicious,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_audit_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
