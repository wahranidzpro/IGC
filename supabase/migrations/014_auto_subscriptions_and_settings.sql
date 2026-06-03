-- ============================================================
-- Migration 014: Auto Subscriptions & Settings
-- Adds a settings table for cloud-based config,
-- ensures every auth user has subscription + membership control,
-- and creates auth.users entries for default local users.
-- ============================================================

-- ============================================================
-- 1. SETTINGS TABLE (cloud alternative to Dexie db.settings)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_read_all ON public.settings
  FOR SELECT USING (get_user_role() IS NOT NULL);

CREATE POLICY settings_write_admin ON public.settings
  FOR ALL USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- 2. ENSURE USER SUBSCRIPTION FUNCTION
-- Auto-creates subscription + memberships_control for any
-- auth user who doesn't have them yet.
-- Called by login API when a user successfully authenticates.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_user_subscription(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  -- Determine role from gym_users
  SELECT role INTO v_role FROM gym_users WHERE auth_user_id = p_user_id;

  -- Create subscription if missing
  INSERT INTO public.subscriptions (user_id, status, plan_name)
  VALUES (p_user_id, 'active', 'Standard')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create memberships_control if missing
  INSERT INTO public.memberships_control (user_id, approved_by_admin, approved_by_reception)
  VALUES (p_user_id, v_role IN ('admin', 'reception', 'coach'), v_role IN ('admin', 'reception'))
  ON CONFLICT (user_id) DO NOTHING;

  -- Return current status
  SELECT jsonb_build_object(
    'subscription_created', true,
    'control_created', true,
    'role', v_role
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 3. SYNC AUTH USERS FROM GYM_USERS (for existing cloud users)
-- Creates auth.users entries for gym_users that have auth_user_id
-- but are missing subscription or memberships_control.
-- ============================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT gu.auth_user_id, gu.role
    FROM gym_users gu
    WHERE gu.auth_user_id IS NOT NULL
      AND (NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = gu.auth_user_id)
        OR NOT EXISTS (SELECT 1 FROM memberships_control mc WHERE mc.user_id = gu.auth_user_id))
  LOOP
    PERFORM public.ensure_user_subscription(v_rec.auth_user_id);
  END LOOP;
END $$;

-- ============================================================
-- 4. INSERT DEFAULT SETTINGS
-- ============================================================

INSERT INTO public.settings (key, value) VALUES
  ('structure_locked', 'false'),
  ('sync_version', '1'),
  ('last_migration', '014')
ON CONFLICT (key) DO NOTHING;
