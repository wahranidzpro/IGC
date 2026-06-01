-- Migration 006: POS Sales sync (offline-first, cross-device)

CREATE TABLE IF NOT EXISTS public.synced_sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  items_json TEXT DEFAULT '[]',
  total NUMERIC(10,2) DEFAULT 0,
  paid NUMERIC(10,2) DEFAULT 0,
  change_amount NUMERIC(10,2) DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'synced_sales' AND policyname = 'Authenticated users can read synced_sales') THEN
    ALTER TABLE public.synced_sales ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Authenticated users can read synced_sales" ON public.synced_sales FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'synced_sales' AND policyname = 'Staff can insert synced_sales') THEN
    CREATE POLICY "Staff can insert synced_sales" ON public.synced_sales FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('admin', 'reception'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'synced_sales' AND policyname = 'Staff can update synced_sales') THEN
    CREATE POLICY "Staff can update synced_sales" ON public.synced_sales FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin', 'reception'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'synced_sales' AND policyname = 'Admins can delete synced_sales') THEN
    CREATE POLICY "Admins can delete synced_sales" ON public.synced_sales FOR DELETE TO authenticated USING (get_current_user_role() = 'admin');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_synced_sale(
  p_local_id INTEGER,
  p_items_json TEXT DEFAULT '[]',
  p_total NUMERIC DEFAULT 0,
  p_paid NUMERIC DEFAULT 0,
  p_change_amount NUMERIC DEFAULT 0,
  p_payment_mode TEXT DEFAULT 'cash',
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
  FROM public.synced_sales
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_sales WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_sales;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_sales (
    local_id, items_json, total, paid, change_amount, payment_mode, updated_at
  ) VALUES (
    v_resolved_id, p_items_json, p_total, p_paid, p_change_amount, p_payment_mode, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    items_json = EXCLUDED.items_json,
    total = EXCLUDED.total,
    paid = EXCLUDED.paid,
    change_amount = EXCLUDED.change_amount,
    payment_mode = EXCLUDED.payment_mode,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'synced_sales') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_sales;
  END IF;
END $$;
