-- Migration 003: Fix RLS policies and add sync helper functions
-- Problem: authenticated users could not insert/select from sync tables
-- Solution: granular per-role policies for all sync tables

-- ============================================
-- 1. HELPER: get current user role from gym_users
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.gym_users WHERE auth_user_id = auth.uid();
  RETURN COALESCE(v_role, 'adherent');
END;
$$;

-- ============================================
-- 2. DROP old permissive policies
-- ============================================

DROP POLICY IF EXISTS "service_role_synced_members" ON public.synced_members;
DROP POLICY IF EXISTS "service_role_synced_payments" ON public.synced_payments;
DROP POLICY IF EXISTS "service_role_synced_checkins" ON public.synced_checkins;
DROP POLICY IF EXISTS "service_role_synced_points_ledger" ON public.synced_points_ledger;
DROP POLICY IF EXISTS "service_role_synced_pin_users" ON public.synced_pin_users;
DROP POLICY IF EXISTS "service_role_sync_logs" ON public.sync_logs;

-- ============================================
-- 3. synced_members — per-role policies
-- ============================================

-- Admins: full CRUD
CREATE POLICY "admin_all_synced_members" ON public.synced_members
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Reception: full CRUD (can create and view members)
CREATE POLICY "reception_all_synced_members" ON public.synced_members
  FOR ALL
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'))
  WITH CHECK (get_current_user_role() IN ('admin', 'reception'));

-- Coaches: SELECT only
CREATE POLICY "coach_read_synced_members" ON public.synced_members
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception', 'coach'));

-- ============================================
-- 4. synced_payments — per-role policies
-- ============================================

CREATE POLICY "admin_all_synced_payments" ON public.synced_payments
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "reception_all_synced_payments" ON public.synced_payments
  FOR ALL
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'))
  WITH CHECK (get_current_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_read_synced_payments" ON public.synced_payments
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception', 'coach'));

-- ============================================
-- 5. synced_checkins — per-role policies
-- ============================================

CREATE POLICY "admin_all_synced_checkins" ON public.synced_checkins
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "reception_all_synced_checkins" ON public.synced_checkins
  FOR ALL
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'))
  WITH CHECK (get_current_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_read_synced_checkins" ON public.synced_checkins
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception', 'coach'));

-- ============================================
-- 6. synced_points_ledger — per-role policies
-- ============================================

CREATE POLICY "admin_all_synced_points_ledger" ON public.synced_points_ledger
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "reception_all_synced_points_ledger" ON public.synced_points_ledger
  FOR ALL
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'))
  WITH CHECK (get_current_user_role() IN ('admin', 'reception'));

CREATE POLICY "coach_read_synced_points_ledger" ON public.synced_points_ledger
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception', 'coach'));

-- ============================================
-- 7. synced_pin_users — per-role policies
-- ============================================

CREATE POLICY "admin_all_synced_pin_users" ON public.synced_pin_users
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "reception_read_synced_pin_users" ON public.synced_pin_users
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'));

-- ============================================
-- 8. sync_logs — service-role + admin access
-- ============================================

CREATE POLICY "admin_all_sync_logs" ON public.sync_logs
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "reception_read_sync_logs" ON public.sync_logs
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() IN ('admin', 'reception'));

-- ============================================
-- 9. Service role escape hatch (always needed)
-- ============================================

CREATE POLICY "service_role_all_sync_tables" ON public.synced_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_synced_payments" ON public.synced_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_synced_checkins" ON public.synced_checkins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_synced_points_ledger" ON public.synced_points_ledger
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_synced_pin_users" ON public.synced_pin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_sync_logs" ON public.sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. FUNCTION: pull_members_from_cloud
--     Returns all synced_members the caller can see
-- ============================================

CREATE OR REPLACE FUNCTION public.pull_members_from_cloud()
RETURNS SETOF public.synced_members
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.synced_members
  WHERE
    CASE get_current_user_role()
      WHEN 'admin' THEN true
      WHEN 'reception' THEN true
      WHEN 'coach' THEN true
      ELSE false
    END;
END;
$$;
