-- Migration 017: synced_whatsapp_campaigns table + RPC + publication

CREATE TABLE IF NOT EXISTS public.synced_whatsapp_campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  template TEXT DEFAULT '',
  member_id INTEGER DEFAULT 0,
  member_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_whatsapp_campaigns"
  ON public.synced_whatsapp_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_whatsapp_campaigns"
  ON public.synced_whatsapp_campaigns FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_whatsapp_campaigns"
  ON public.synced_whatsapp_campaigns FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_whatsapp_campaign(
  p_local_id INTEGER,
  p_template TEXT DEFAULT '',
  p_member_id INTEGER DEFAULT 0,
  p_member_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_message TEXT DEFAULT '',
  p_status TEXT DEFAULT 'sent',
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
  FROM public.synced_whatsapp_campaigns
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_whatsapp_campaigns WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_whatsapp_campaigns;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_whatsapp_campaigns (
    local_id, template, member_id, member_name, phone, message, status, updated_at
  ) VALUES (
    v_resolved_id, p_template, p_member_id, p_member_name, p_phone, p_message, p_status, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    template = EXCLUDED.template,
    member_id = EXCLUDED.member_id,
    member_name = EXCLUDED.member_name,
    phone = EXCLUDED.phone,
    message = EXCLUDED.message,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_whatsapp_campaigns;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
