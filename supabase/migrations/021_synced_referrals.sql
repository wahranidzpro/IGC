-- Migration 021: Sync table for referrals
-- New entity tracking referral rewards

CREATE TABLE IF NOT EXISTS public.synced_referrals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  local_id INTEGER UNIQUE NOT NULL,
  sponsor_id INTEGER NOT NULL DEFAULT 0,
  sponsor_name TEXT NOT NULL DEFAULT '',
  referred_id INTEGER NOT NULL DEFAULT 0,
  referred_name TEXT NOT NULL DEFAULT '',
  subscription_duration TEXT DEFAULT '',
  points_awarded INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.synced_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_synced_referrals"
  ON public.synced_referrals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_all_synced_referrals"
  ON public.synced_referrals FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "reception_all_synced_referrals"
  ON public.synced_referrals FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'reception'));

CREATE OR REPLACE FUNCTION public.upsert_synced_referral(
  p_local_id INTEGER,
  p_sponsor_id INTEGER DEFAULT 0,
  p_sponsor_name TEXT DEFAULT '',
  p_referred_id INTEGER DEFAULT 0,
  p_referred_name TEXT DEFAULT '',
  p_subscription_duration TEXT DEFAULT '',
  p_points_awarded INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'pending',
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
  FROM public.synced_referrals
  WHERE local_id = p_local_id;

  IF v_resolved_id IS NULL THEN
    v_resolved_id := p_local_id;
  END IF;

  INSERT INTO public.synced_referrals (
    local_id, sponsor_id, sponsor_name, referred_id, referred_name,
    subscription_duration, points_awarded, status, updated_at
  ) VALUES (
    v_resolved_id, p_sponsor_id, p_sponsor_name, p_referred_id, p_referred_name,
    p_subscription_duration, p_points_awarded, p_status, p_updated_at
  )
  ON CONFLICT (local_id) DO UPDATE SET
    sponsor_id = EXCLUDED.sponsor_id,
    sponsor_name = EXCLUDED.sponsor_name,
    referred_id = EXCLUDED.referred_id,
    referred_name = EXCLUDED.referred_name,
    subscription_duration = EXCLUDED.subscription_duration,
    points_awarded = EXCLUDED.points_awarded,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

  RETURN v_resolved_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_referrals;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
