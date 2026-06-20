-- Migration 026: Fix overly permissive RLS policies on synced_* tables
--
-- Problem: Many synced_* tables had policies like
--   "authenticated_read_synced_X" FOR SELECT TO authenticated USING (true)
-- which allows ANY authenticated user (including adherents) to read ALL data.
--
-- Fix:
--   1. Create is_admin() and is_staff() helper functions
--   2. Drop all permissive "authenticated_read_*" / "Authenticated users can read *" policies
--   3. Create restricted "staff_read_*" policies using the helpers
--   4. Create "own_read_*" policy for synced_profiles (adherents read own profile)

-- ============================================================
-- 1. Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_users
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'reception', 'coach')
  );
$$;

-- ============================================================
-- 2. Migration 005: synced_products, synced_programs, synced_subscription_plans
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read synced_products" ON public.synced_products;
DROP POLICY IF EXISTS "Authenticated users can read synced_programs" ON public.synced_programs;
DROP POLICY IF EXISTS "Authenticated users can read synced_subscription_plans" ON public.synced_subscription_plans;

CREATE POLICY "staff_read_synced_products" ON public.synced_products
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_programs" ON public.synced_programs
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_subscription_plans" ON public.synced_subscription_plans
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 3. Migration 006: synced_sales
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read synced_sales" ON public.synced_sales;

CREATE POLICY "staff_read_synced_sales" ON public.synced_sales
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 4. Migration 015: synced_coaches, synced_expenses,
--    synced_private_sessions, synced_events, synced_event_registrations
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_coaches" ON public.synced_coaches;
DROP POLICY IF EXISTS "authenticated_read_synced_expenses" ON public.synced_expenses;
DROP POLICY IF EXISTS "authenticated_read_synced_private_sessions" ON public.synced_private_sessions;
DROP POLICY IF EXISTS "authenticated_read_synced_events" ON public.synced_events;
DROP POLICY IF EXISTS "authenticated_read_synced_event_registrations" ON public.synced_event_registrations;

CREATE POLICY "staff_read_synced_coaches" ON public.synced_coaches
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_expenses" ON public.synced_expenses
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_events" ON public.synced_events
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_event_registrations" ON public.synced_event_registrations
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 5. Migration 016: synced_rewards, synced_product_categories
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_rewards" ON public.synced_rewards;
DROP POLICY IF EXISTS "authenticated_read_synced_product_categories" ON public.synced_product_categories;

CREATE POLICY "staff_read_synced_rewards" ON public.synced_rewards
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_product_categories" ON public.synced_product_categories
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 6. Migration 017: synced_whatsapp_campaigns
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_whatsapp_campaigns" ON public.synced_whatsapp_campaigns;

CREATE POLICY "staff_read_synced_whatsapp_campaigns" ON public.synced_whatsapp_campaigns
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 7. Migration 019: synced_loyalty_settings
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_loyalty_settings" ON public.synced_loyalty_settings;

CREATE POLICY "staff_read_synced_loyalty_settings" ON public.synced_loyalty_settings
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 8. Migration 020: synced_campaigns, synced_message_templates
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_campaigns" ON public.synced_campaigns;
DROP POLICY IF EXISTS "authenticated_read_synced_message_templates" ON public.synced_message_templates;

CREATE POLICY "staff_read_synced_campaigns" ON public.synced_campaigns
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_message_templates" ON public.synced_message_templates
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 9. Migration 021: synced_referrals
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_referrals" ON public.synced_referrals;

CREATE POLICY "staff_read_synced_referrals" ON public.synced_referrals
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 10. Migration 022: synced_audit_logs
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_audit_logs" ON public.synced_audit_logs;

CREATE POLICY "staff_read_synced_audit_logs" ON public.synced_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 11. Migration 024: synced_settings
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_settings" ON public.synced_settings;

CREATE POLICY "staff_read_synced_settings" ON public.synced_settings
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ============================================================
-- 12. Migration 025: synced_workout_programs, synced_nutrition_programs,
--     synced_schedules, synced_progress_logs, synced_access_logs,
--     synced_profiles, synced_club_info
-- ============================================================

DROP POLICY IF EXISTS "authenticated_read_synced_workout_programs" ON public.synced_workout_programs;
DROP POLICY IF EXISTS "authenticated_read_synced_nutrition_programs" ON public.synced_nutrition_programs;
DROP POLICY IF EXISTS "authenticated_read_synced_schedules" ON public.synced_schedules;
DROP POLICY IF EXISTS "authenticated_read_synced_progress_logs" ON public.synced_progress_logs;
DROP POLICY IF EXISTS "authenticated_read_synced_access_logs" ON public.synced_access_logs;
DROP POLICY IF EXISTS "authenticated_read_synced_profiles" ON public.synced_profiles;
DROP POLICY IF EXISTS "authenticated_read_synced_club_info" ON public.synced_club_info;

CREATE POLICY "staff_read_synced_access_logs" ON public.synced_access_logs
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_synced_club_info" ON public.synced_club_info
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- synced_profiles: staff can read all, adherents can read own
CREATE POLICY "staff_read_synced_profiles" ON public.synced_profiles
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "own_read_synced_profiles" ON public.synced_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- Tables from migration 025 that already have admin_all + reception_all + coach_all
-- (synced_workout_programs, synced_nutrition_programs, synced_schedules,
--  synced_progress_logs) already provide full access to all staff
-- via their existing per-role ALL policies, so no additional staff_read needed.
