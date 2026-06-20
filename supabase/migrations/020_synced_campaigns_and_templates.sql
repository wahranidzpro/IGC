-- Migration 020: Sync tables for campaigns + messageTemplates
-- Already referenced in registry but tables missing in SQL

-- ============================================
-- 1. synced_campaigns
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  template_id INTEGER DEFAULT 0,
  template_name TEXT DEFAULT '',
  filters TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_campaigns"
  ON public.synced_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_campaigns"
  ON public.synced_campaigns FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_campaigns"
  ON public.synced_campaigns FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_campaign(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_template_id INTEGER DEFAULT 0,
  p_template_name TEXT DEFAULT '',
  p_filters TEXT DEFAULT '',
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_sent_at TIMESTAMPTZ DEFAULT NULL,
  p_total_count INTEGER DEFAULT 0,
  p_success_count INTEGER DEFAULT 0,
  p_failed_count INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'draft',
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
  FROM public.synced_campaigns
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_campaigns (
    local_id, name, template_id, template_name, filters,
    scheduled_at, sent_at, total_count, success_count, failed_count,
    status, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_template_id, p_template_name, p_filters,
    p_scheduled_at, p_sent_at, p_total_count, p_success_count, p_failed_count,
    p_status, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    template_id = EXCLUDED.template_id,
    template_name = EXCLUDED.template_name,
    filters = EXCLUDED.filters,
    scheduled_at = EXCLUDED.scheduled_at,
    sent_at = EXCLUDED.sent_at,
    total_count = EXCLUDED.total_count,
    success_count = EXCLUDED.success_count,
    failed_count = EXCLUDED.failed_count,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================
-- 2. synced_message_templates
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_message_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_message_templates"
  ON public.synced_message_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_message_templates"
  ON public.synced_message_templates FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_message_templates"
  ON public.synced_message_templates FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_message_template(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_content TEXT DEFAULT '',
  p_category TEXT DEFAULT 'general',
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
  FROM public.synced_message_templates
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_message_templates (
    local_id, name, content, category, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_content, p_category, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_campaigns;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_message_templates;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
