-- Migration 010: Fix gym_users RLS - restrict from public access
-- Drop all existing open policies on gym_users

DO $$ BEGIN
  DROP POLICY IF EXISTS "gym_users_public_read" ON gym_users;
  DROP POLICY IF EXISTS "gym_users_public_insert" ON gym_users;
  DROP POLICY IF EXISTS "gym_users_public_update" ON gym_users;
  DROP POLICY IF EXISTS "gym_users_public_delete" ON gym_users;
END $$;

-- Admin: full access
CREATE POLICY "admin_all_gym_users" ON gym_users
  FOR ALL USING (get_user_role() = 'admin');

-- Authenticated users: read own record
CREATE POLICY "authenticated_read_own" ON gym_users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Service role: full access (for login route and admin operations)
CREATE POLICY "service_role_all_gym_users" ON gym_users
  FOR ALL USING (current_setting('role') = 'service_role');
