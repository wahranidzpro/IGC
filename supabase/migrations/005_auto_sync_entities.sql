-- Migration 005: Auto-sync for products, programs, subscription plans + audit

-- ============================================================
-- 1. synced_products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  barcode TEXT DEFAULT '',
  name TEXT DEFAULT '',
  buy_price NUMERIC(10,2) DEFAULT 0,
  sell_price NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  photo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read synced_products"
  ON public.synced_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert synced_products"
  ON public.synced_products FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update synced_products"
  ON public.synced_products FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete synced_products"
  ON public.synced_products FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- ============================================================
-- 2. synced_programs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_programs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read synced_programs"
  ON public.synced_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert synced_programs"
  ON public.synced_programs FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update synced_programs"
  ON public.synced_programs FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete synced_programs"
  ON public.synced_programs FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- ============================================================
-- 3. synced_subscription_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_subscription_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  type TEXT DEFAULT 'subscription',
  duration TEXT DEFAULT '',
  sessions_count INTEGER DEFAULT 0,
  price NUMERIC(10,2) DEFAULT 0,
  description TEXT DEFAULT '',
  program_id INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read synced_subscription_plans"
  ON public.synced_subscription_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert synced_subscription_plans"
  ON public.synced_subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update synced_subscription_plans"
  ON public.synced_subscription_plans FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete synced_subscription_plans"
  ON public.synced_subscription_plans FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- ============================================================
-- 4. Cloud audit log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sync_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.sync_audit_log FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Service role can insert audit log"
  ON public.sync_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 5. Upsert RPCs
-- ============================================================

-- upsert_synced_product
CREATE OR REPLACE FUNCTION public.upsert_synced_product(
  p_local_id INTEGER,
  p_barcode TEXT DEFAULT '',
  p_name TEXT DEFAULT '',
  p_buy_price NUMERIC DEFAULT 0,
  p_sell_price NUMERIC DEFAULT 0,
  p_stock INTEGER DEFAULT 0,
  p_photo TEXT DEFAULT '',
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resolved_id INTEGER;
BEGIN
  -- Try to find by local_id first
  SELECT local_id INTO v_resolved_id
  FROM public.synced_products
  WHERE local_id = p_local_id;

  -- If no match, check barcode
  IF v_resolved_id IS NULL AND p_barcode != '' THEN
    SELECT local_id INTO v_resolved_id
    FROM public.synced_products
    WHERE barcode = p_barcode
    LIMIT 1;
  END IF;

  -- Handle local_id conflict
  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_products WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_products;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  END IF;

  INSERT INTO public.synced_products (
    local_id, barcode, name, buy_price, sell_price, stock, photo, updated_at
  ) VALUES (
    v_resolved_id, p_barcode, p_name, p_buy_price, p_sell_price, p_stock, p_photo, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    barcode = EXCLUDED.barcode,
    name = EXCLUDED.name,
    buy_price = EXCLUDED.buy_price,
    sell_price = EXCLUDED.sell_price,
    stock = EXCLUDED.stock,
    photo = EXCLUDED.photo,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- upsert_synced_program
CREATE OR REPLACE FUNCTION public.upsert_synced_program(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_price NUMERIC DEFAULT 0,
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
  FROM public.synced_programs
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_programs WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_programs;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_programs (
    local_id, name, description, price, is_active, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_description, p_price, p_is_active, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- upsert_synced_subscription_plan
CREATE OR REPLACE FUNCTION public.upsert_synced_subscription_plan(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_type TEXT DEFAULT 'subscription',
  p_duration TEXT DEFAULT '',
  p_sessions_count INTEGER DEFAULT 0,
  p_price NUMERIC DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_program_id INTEGER DEFAULT 0,
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
  FROM public.synced_subscription_plans
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_subscription_plans WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_subscription_plans;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_subscription_plans (
    local_id, name, type, duration, sessions_count, price,
    description, program_id, is_active, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_type, p_duration, p_sessions_count, p_price,
    p_description, p_program_id, p_is_active, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    duration = EXCLUDED.duration,
    sessions_count = EXCLUDED.sessions_count,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    program_id = EXCLUDED.program_id,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 6. Push audit log to cloud
-- ============================================================
CREATE OR REPLACE FUNCTION public.push_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id INTEGER DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_performed_by TEXT DEFAULT '',
  p_performed_by_role TEXT DEFAULT ''
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.sync_audit_log (
    action, entity_type, entity_id, old_value, new_value,
    performed_by, performed_by_role
  ) VALUES (
    p_action, p_entity_type, p_entity_id, p_old_value, p_new_value,
    p_performed_by, p_performed_by_role
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 7. Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_subscription_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_audit_log;
