-- Migration 016: Complete sync for rewards, productCategories, referredBy
-- Ajoute les tables manquantes + champ referred_by sur synced_members

-- ============================================================
-- 1. referred_by sur synced_members
-- ============================================================
ALTER TABLE public.synced_members ADD COLUMN IF NOT EXISTS referred_by INTEGER DEFAULT 0;

-- Recréer la fonction upsert_synced_member avec le nouveau paramètre
DROP FUNCTION IF EXISTS public.upsert_synced_member;

CREATE OR REPLACE FUNCTION public.upsert_synced_member(
  p_local_id INTEGER,
  p_phone TEXT,
  p_first_name TEXT DEFAULT '',
  p_last_name TEXT DEFAULT '',
  p_birth_date TEXT DEFAULT '',
  p_address TEXT DEFAULT '',
  p_gender TEXT DEFAULT 'other',
  p_blood_type TEXT DEFAULT '',
  p_photo TEXT DEFAULT '',
  p_coach_id INTEGER DEFAULT NULL,
  p_program_id INTEGER DEFAULT NULL,
  p_sessions_left INTEGER DEFAULT 0,
  p_program_amount NUMERIC DEFAULT 0,
  p_amount_paid NUMERIC DEFAULT 0,
  p_balance_due NUMERIC DEFAULT 0,
  p_discount NUMERIC DEFAULT 0,
  p_advance NUMERIC DEFAULT 0,
  p_subscription_type TEXT DEFAULT 'free_session',
  p_subscription_duration TEXT DEFAULT '',
  p_status TEXT DEFAULT 'active',
  p_fidelity_points INTEGER DEFAULT 0,
  p_rfid_code TEXT DEFAULT '',
  p_is_blocked BOOLEAN DEFAULT false,
  p_block_reason TEXT DEFAULT NULL,
  p_block_date TIMESTAMPTZ DEFAULT NULL,
  p_blocked_until TIMESTAMPTZ DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_emergency_contact_name TEXT DEFAULT NULL,
  p_emergency_contact_phone TEXT DEFAULT NULL,
  p_allergies TEXT DEFAULT NULL,
  p_weight NUMERIC DEFAULT NULL,
  p_weight_current NUMERIC DEFAULT NULL,
  p_height NUMERIC DEFAULT NULL,
  p_fitness_goal TEXT DEFAULT NULL,
  p_experience_level TEXT DEFAULT NULL,
  p_referred_by INTEGER DEFAULT 0,
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id INTEGER;
  v_resolved_local_id INTEGER;
  v_phone_key TEXT;
BEGIN
  v_phone_key := COALESCE(NULLIF(TRIM(p_phone), ''), 'unknown-' || p_local_id);

  SELECT local_id INTO v_existing_id
  FROM public.synced_members
  WHERE phone = v_phone_key
    AND phone NOT LIKE 'unknown-%'
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    SELECT local_id INTO v_existing_id
    FROM public.synced_members
    WHERE local_id = p_local_id;
  END IF;

  IF v_existing_id IS NULL THEN
    PERFORM 1 FROM public.synced_members WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_local_id FROM public.synced_members;
    ELSE
      v_resolved_local_id := p_local_id;
    END IF;
  ELSE
    v_resolved_local_id := v_existing_id;
  END IF;

  INSERT INTO public.synced_members (
    local_id, phone, first_name, last_name, birth_date,
    address, gender, blood_type, photo, coach_id,
    program_id, sessions_left, program_amount, amount_paid, balance_due,
    discount, advance, subscription_type, subscription_duration, status,
    fidelity_points, rfid_code, is_blocked, block_reason, block_date,
    blocked_until, email, emergency_contact_name, emergency_contact_phone,
    allergies, weight, weight_current, height, fitness_goal,
    experience_level, referred_by, updated_at
  ) VALUES (
    v_resolved_local_id, v_phone_key, p_first_name, p_last_name, p_birth_date,
    p_address, p_gender, p_blood_type, p_photo, p_coach_id,
    p_program_id, p_sessions_left, p_program_amount, p_amount_paid, p_balance_due,
    p_discount, p_advance, p_subscription_type, p_subscription_duration, p_status,
    p_fidelity_points, p_rfid_code, p_is_blocked, p_block_reason, p_block_date,
    p_blocked_until, p_email, p_emergency_contact_name, p_emergency_contact_phone,
    p_allergies, p_weight, p_weight_current, p_height, p_fitness_goal,
    p_experience_level, p_referred_by, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    birth_date = EXCLUDED.birth_date,
    address = EXCLUDED.address,
    gender = EXCLUDED.gender,
    blood_type = EXCLUDED.blood_type,
    photo = EXCLUDED.photo,
    coach_id = EXCLUDED.coach_id,
    program_id = EXCLUDED.program_id,
    sessions_left = EXCLUDED.sessions_left,
    program_amount = EXCLUDED.program_amount,
    amount_paid = EXCLUDED.amount_paid,
    balance_due = EXCLUDED.balance_due,
    discount = EXCLUDED.discount,
    advance = EXCLUDED.advance,
    subscription_type = EXCLUDED.subscription_type,
    subscription_duration = EXCLUDED.subscription_duration,
    status = EXCLUDED.status,
    fidelity_points = EXCLUDED.fidelity_points,
    rfid_code = EXCLUDED.rfid_code,
    is_blocked = EXCLUDED.is_blocked,
    block_reason = EXCLUDED.block_reason,
    block_date = EXCLUDED.block_date,
    blocked_until = EXCLUDED.blocked_until,
    email = EXCLUDED.email,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    allergies = EXCLUDED.allergies,
    weight = EXCLUDED.weight,
    weight_current = EXCLUDED.weight_current,
    height = EXCLUDED.height,
    fitness_goal = EXCLUDED.fitness_goal,
    experience_level = EXCLUDED.experience_level,
    referred_by = EXCLUDED.referred_by,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_local_id;
END;
$$;

-- ============================================================
-- 2. synced_rewards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_rewards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  points_required INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_rewards"
  ON public.synced_rewards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_rewards"
  ON public.synced_rewards FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_rewards"
  ON public.synced_rewards FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_reward(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_points_required INTEGER DEFAULT 0,
  p_stock INTEGER DEFAULT 0,
  p_image TEXT DEFAULT '',
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
  FROM public.synced_rewards
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_rewards WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_rewards;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_rewards (
    local_id, name, description, points_required, stock, image, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_description, p_points_required, p_stock, p_image, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    points_required = EXCLUDED.points_required,
    stock = EXCLUDED.stock,
    image = EXCLUDED.image,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 3. synced_product_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.synced_product_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_product_categories"
  ON public.synced_product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_product_categories"
  ON public.synced_product_categories FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_product_categories"
  ON public.synced_product_categories FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_product_category(
  p_local_id INTEGER,
  p_name TEXT DEFAULT '',
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
  FROM public.synced_product_categories
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    PERFORM 1 FROM public.synced_product_categories WHERE local_id = p_local_id;
    IF FOUND THEN
      SELECT COALESCE(MAX(local_id), 0) + 1 INTO v_resolved_id FROM public.synced_product_categories;
    ELSE
      v_resolved_id := p_local_id;
    END IF;
  ELSE
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_product_categories (
    local_id, name, updated_at
  ) VALUES (
    v_resolved_id, p_name, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

-- ============================================================
-- 4. Add to Realtime publication
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_rewards;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_product_categories;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
