-- ============================================================
-- INFINITY GYM - Centralized Authentication & Authorization
-- Migration 002: Subscriptions, memberships_control, can_access()
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  plan_name TEXT DEFAULT 'Standard',
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 2. MEMBERSHIPS CONTROL TABLE
CREATE TABLE IF NOT EXISTS memberships_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_by_admin BOOLEAN NOT NULL DEFAULT false,
  approved_by_reception BOOLEAN NOT NULL DEFAULT false,
  approved_by_admin_at TIMESTAMPTZ,
  approved_by_reception_at TIMESTAMPTZ,
  approved_by_admin_id UUID REFERENCES auth.users(id),
  approved_by_reception_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memberships_control_user_id ON memberships_control(user_id);

-- 3. VALIDATION LOGS (Bonus: track admin/reception validations)
CREATE TABLE IF NOT EXISTS validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved_by_admin', 'approved_by_reception', 'subscription_activated', 'subscription_suspended', 'subscription_expired', 'access_granted', 'access_denied')),
  performed_by UUID REFERENCES auth.users(id),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_logs_user_id ON validation_logs(user_id);
CREATE INDEX idx_validation_logs_created_at ON validation_logs(created_at DESC);

-- 4. UPDATE GYM_USERS (add link to auth.users)
ALTER TABLE gym_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_gym_users_auth_user_id ON gym_users(auth_user_id);

-- 5. SUBSCRIPTION HISTORY (Bonus)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);

-- ============================================================
-- CAN ACCESS APP FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION can_access_app(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription subscriptions;
  v_control memberships_control;
  v_result JSONB;
BEGIN
  -- Fetch subscription
  SELECT * INTO v_subscription FROM subscriptions WHERE user_id = p_user_id;
  -- Fetch membership control
  SELECT * INTO v_control FROM memberships_control WHERE user_id = p_user_id;

  -- Check conditions
  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'NO_SUBSCRIPTION',
      'message', 'Aucun abonnement trouvé. Veuillez contacter l''administration.',
      'subscription_status', 'none',
      'approved_by_admin', COALESCE(v_control.approved_by_admin, false),
      'approved_by_reception', COALESCE(v_control.approved_by_reception, false)
    );
  END IF;

  IF v_subscription.status != 'active' THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'SUBSCRIPTION_NOT_ACTIVE',
      'message', CASE
        WHEN v_subscription.status = 'expired' THEN 'Votre abonnement a expiré. Veuillez le renouveler.'
        WHEN v_subscription.status = 'suspended' THEN 'Votre abonnement est suspendu. Contactez l''administration.'
        ELSE 'Abonnement non actif.'
      END,
      'subscription_status', v_subscription.status,
      'approved_by_admin', COALESCE(v_control.approved_by_admin, false),
      'approved_by_reception', COALESCE(v_control.approved_by_reception, false)
    );
  END IF;

  IF v_subscription.end_date IS NOT NULL AND v_subscription.end_date < now() THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'SUBSCRIPTION_EXPIRED',
      'message', 'Votre abonnement a expiré le ' || to_char(v_subscription.end_date, 'DD/MM/YYYY') || '. Veuillez le renouveler.',
      'subscription_status', 'expired',
      'end_date', v_subscription.end_date,
      'approved_by_admin', COALESCE(v_control.approved_by_admin, false),
      'approved_by_reception', COALESCE(v_control.approved_by_reception, false)
    );
  END IF;

  IF v_control.id IS NULL THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'NO_MEMBERSHIP_CONTROL',
      'message', 'Validation en attente. Veuillez contacter l''administration.',
      'subscription_status', v_subscription.status,
      'approved_by_admin', false,
      'approved_by_reception', false
    );
  END IF;

  IF v_control.approved_by_admin = false THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'PENDING_ADMIN_APPROVAL',
      'message', 'Validation administrateur en attente.',
      'subscription_status', v_subscription.status,
      'approved_by_admin', false,
      'approved_by_reception', v_control.approved_by_reception
    );
  END IF;

  IF v_control.approved_by_reception = false THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason', 'PENDING_RECEPTION_APPROVAL',
      'message', 'Validation réception en attente.',
      'subscription_status', v_subscription.status,
      'approved_by_admin', v_control.approved_by_admin,
      'approved_by_reception', false
    );
  END IF;

  -- ALL CONDITIONS MET
  RETURN jsonb_build_object(
    'granted', true,
    'reason', 'ACCESS_GRANTED',
    'message', 'Accès autorisé.',
    'subscription_status', v_subscription.status,
    'subscription_end_date', v_subscription.end_date,
    'approved_by_admin', true,
    'approved_by_reception', true,
    'plan_name', v_subscription.plan_name
  );
END;
$$;

-- ============================================================
-- HELPER VIEW: access_status
-- ============================================================
CREATE OR REPLACE VIEW user_access_status AS
SELECT
  u.id AS user_id,
  u.username,
  u.role,
  u.name,
  s.status AS subscription_status,
  s.end_date AS subscription_end_date,
  s.plan_name,
  mc.approved_by_admin,
  mc.approved_by_reception,
  CASE
    WHEN s.id IS NULL THEN false
    WHEN s.status != 'active' THEN false
    WHEN s.end_date IS NOT NULL AND s.end_date < now() THEN false
    WHEN mc.id IS NULL THEN false
    WHEN mc.approved_by_admin = false THEN false
    WHEN mc.approved_by_reception = false THEN false
    ELSE true
  END AS access_granted
FROM gym_users u
LEFT JOIN subscriptions s ON s.user_id = u.auth_user_id
LEFT JOIN memberships_control mc ON mc.user_id = u.auth_user_id;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- Auto-update updated_at for memberships_control
CREATE OR REPLACE FUNCTION update_memberships_control_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_memberships_control_updated_at
  BEFORE UPDATE ON memberships_control
  FOR EACH ROW EXECUTE FUNCTION update_memberships_control_updated_at();

-- Log subscription status changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO subscription_history (user_id, previous_status, new_status, reason)
    VALUES (NEW.user_id, OLD.status, NEW.status, 'status_change');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_change_log
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_subscription_change();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper: get role from gym_users
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM gym_users WHERE auth_user_id = auth.uid();
  RETURN v_role;
END;
$$;

-- SUBSCRIPTIONS RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY admin_all_subscriptions ON subscriptions
  FOR ALL USING (get_user_role() = 'admin');

-- Users: read own subscription
CREATE POLICY user_read_own_subscription ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Reception: read all, update approval-related
CREATE POLICY reception_read_subscriptions ON subscriptions
  FOR SELECT USING (get_user_role() = 'reception');

-- MEMBERSHIPS CONTROL RLS
ALTER TABLE memberships_control ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY admin_all_memberships_control ON memberships_control
  FOR ALL USING (get_user_role() = 'admin');

-- Users: read own control status
CREATE POLICY user_read_own_control ON memberships_control
  FOR SELECT USING (user_id = auth.uid());

-- Reception: read all, update approved_by_reception
CREATE POLICY reception_read_memberships_control ON memberships_control
  FOR SELECT USING (get_user_role() = 'reception');

CREATE POLICY reception_update_memberships_control ON memberships_control
  FOR UPDATE USING (get_user_role() = 'reception')
  WITH CHECK (get_user_role() = 'reception');

-- VALIDATION LOGS RLS
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_validation_logs ON validation_logs
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY reception_read_validation_logs ON validation_logs
  FOR SELECT USING (get_user_role() = 'reception');

CREATE POLICY user_read_own_validation_logs ON validation_logs
  FOR SELECT USING (user_id = auth.uid());

-- SUBSCRIPTION HISTORY RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_subscription_history ON subscription_history
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY user_read_own_subscription_history ON subscription_history
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- ADD REAL AUTH USERS (migrate existing gym_users to auth.users)
-- ============================================================

-- Function to ensure auth.users exist for all gym_users
CREATE OR REPLACE FUNCTION ensure_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_auth_id UUID;
BEGIN
  FOR v_user IN SELECT * FROM gym_users WHERE auth_user_id IS NULL
  LOOP
    -- Try to find existing auth user by email convention
    SELECT id INTO v_auth_id FROM auth.users WHERE email = v_user.username || '@infinitygym.local';
    
    IF v_auth_id IS NULL THEN
      -- We can't create auth.users directly from SQL (requires admin API)
      -- Just link to a placeholder - real migration happens via admin API
      CONTINUE;
    END IF;

    UPDATE gym_users SET auth_user_id = v_auth_id WHERE id = v_user.id;

    -- Create default subscription
    INSERT INTO subscriptions (user_id, status)
    VALUES (v_auth_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default membership control (pre-approved for admin)
    INSERT INTO memberships_control (user_id, approved_by_admin, approved_by_reception)
    VALUES (v_auth_id, v_user.role = 'admin', v_user.role IN ('admin', 'reception'))
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$;
